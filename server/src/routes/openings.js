import { Router } from 'express';
import crypto from 'crypto';
import { supabaseAdmin, supabaseAsUser } from '../config/supabase.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
const MAX_OPEN_OPENINGS = Number(process.env.MAX_OPEN_OPENINGS || 5);

/* referrer fields exposed publicly on openings */
const OWNER_JOIN =
  'referrer:profiles!referral_openings_referrer_id_fkey(id, full_name, avatar_url, current_company, trust_score, is_premium)';

/* ============================================================
   GET /api/openings  - browse all OPEN openings (marketplace)
   optional: ?company= &q=
   ============================================================ */
router.get('/', requireAuth, async (req, res) => {
  let query = supabaseAdmin
    .from('referral_openings')
    .select(`*, ${OWNER_JOIN}`)
    .eq('status', 'open')
    .order('created_at', { ascending: false });

  if (req.query.company) query = query.ilike('company_name', `%${req.query.company}%`);
  if (req.query.q) query = query.ilike('role_title', `%${req.query.q}%`);

  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

/* GET /api/openings/mine - openings I (referrer) posted */
router.get('/mine', requireAuth, async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from('referral_openings')
    .select('*')
    .eq('referrer_id', req.user.id)
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

/* GET /api/openings/:id - single opening + its claims (owner sees claims) */
router.get('/:id', requireAuth, async (req, res) => {
  const { data: opening, error } = await supabaseAdmin
    .from('referral_openings')
    .select(`*, ${OWNER_JOIN}`)
    .eq('id', req.params.id)
    .single();

  if (error) return res.status(404).json({ error: 'Opening not found' });

  const is_owner = opening.referrer_id === req.user.id;

  let claims = [];
  if (is_owner) {
    // owner sees everyone who grabbed it
    const { data } = await supabaseAdmin
      .from('opening_claims')
      .select('*, seeker:profiles!opening_claims_seeker_id_fkey(id, full_name, avatar_url, current_company, trust_score, is_premium)')
      .eq('opening_id', opening.id)
      .order('created_at', { ascending: false });
    claims = data || [];
  } else {
    // a seeker sees only their own claim (if any)
    const { data } = await supabaseAdmin
      .from('opening_claims')
      .select('*')
      .eq('opening_id', opening.id)
      .eq('seeker_id', req.user.id)
      .maybeSingle();
    claims = data ? [data] : [];
  }

  res.json({ opening, claims, is_owner });
});

/* ============================================================
   POST /api/openings  - a referrer posts an opening
   ============================================================ */
router.post('/', requireAuth, async (req, res) => {
  const { company_name, role_title, job_link, jd_doc_url, notes, slots, rp_price } = req.body || {};

  if (!company_name || !role_title) {
    return res.status(400).json({ error: 'company_name and role_title are required' });
  }

  // anti-spam: cap concurrent open openings
  const { count } = await supabaseAdmin
    .from('referral_openings')
    .select('id', { count: 'exact', head: true })
    .eq('referrer_id', req.user.id)
    .eq('status', 'open');

  if ((count || 0) >= MAX_OPEN_OPENINGS) {
    return res.status(429).json({
      error: `You already have ${MAX_OPEN_OPENINGS} open openings. Close one first.`,
    });
  }

  const nSlots = Math.min(20, Math.max(1, Number(slots) || 1));
  const price = Math.min(500, Math.max(10, Number(rp_price) || 50));

  const { data, error } = await supabaseAdmin
    .from('referral_openings')
    .insert({
      referrer_id: req.user.id,
      company_name,
      role_title,
      job_link: job_link || null,
      jd_doc_url: jd_doc_url || null,
      notes: notes || null,
      slots: nSlots,
      rp_price: price,
    })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

/* PATCH /api/openings/:id/close - owner closes an opening */
router.patch('/:id/close', requireAuth, async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from('referral_openings')
    .update({ status: 'closed' })
    .eq('id', req.params.id)
    .eq('referrer_id', req.user.id)
    .neq('status', 'filled')
    .select()
    .single();

  if (error) return res.status(400).json({ error: 'Could not close opening' });
  res.json(data);
});

/* ============================================================
   CLAIMS
   ============================================================ */

/* POST /api/openings/:id/claim - seeker grabs an opening (resume mandatory)
   body: { resume_url, message } */
router.post('/:id/claim', requireAuth, async (req, res) => {
  const { resume_url, message } = req.body || {};
  if (!resume_url || !resume_url.trim()) {
    return res.status(400).json({ error: 'A resume is required to grab this opening' });
  }

  const { data: opening, error: oErr } = await supabaseAdmin
    .from('referral_openings')
    .select('*')
    .eq('id', req.params.id)
    .single();

  if (oErr || !opening) return res.status(404).json({ error: 'Opening not found' });
  if (opening.status !== 'open') return res.status(400).json({ error: 'This opening is no longer open' });
  if (opening.referrer_id === req.user.id) {
    return res.status(400).json({ error: 'You cannot grab your own opening' });
  }

  const { data, error } = await supabaseAdmin
    .from('opening_claims')
    .insert({
      opening_id: opening.id,
      seeker_id: req.user.id,
      resume_url: resume_url.trim(),
      message: message || null,
    })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      return res.status(409).json({ error: 'You have already grabbed this opening' });
    }
    return res.status(500).json({ error: error.message });
  }

  res.status(201).json(data);
});

/* GET /api/openings/claims/mine - claims I (seeker) made */
router.get('/claims/mine', requireAuth, async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from('opening_claims')
    .select('*, opening:referral_openings(id, company_name, role_title, rp_price, status)')
    .eq('seeker_id', req.user.id)
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

/* POST /api/openings/claims/:claimId/proof - referrer submits proof (mandatory)
   body: { proof_url } */
router.post('/claims/:claimId/proof', requireAuth, async (req, res) => {
  const { proof_url } = req.body || {};
  if (!proof_url || !proof_url.trim()) {
    return res.status(400).json({ error: 'Proof is mandatory' });
  }
  const proof_hash = crypto.createHash('sha256').update(proof_url.trim()).digest('hex');

  const userClient = supabaseAsUser(req.token);
  const { data, error } = await userClient.rpc('submit_claim_proof', {
    p_claim_id: req.params.claimId,
    p_proof_url: proof_url.trim(),
    p_proof_hash: proof_hash,
  });

  if (error) return res.status(400).json({ error: mapDbError(error.message) });
  res.json(data);
});

/* POST /api/openings/claims/:claimId/approve - seeker confirms -> RP moves */
router.post('/claims/:claimId/approve', requireAuth, async (req, res) => {
  const userClient = supabaseAsUser(req.token);
  const { data, error } = await userClient.rpc('approve_claim', {
    p_claim_id: req.params.claimId,
  });

  if (error) return res.status(400).json({ error: mapDbError(error.message) });
  res.json(data);
});

/* POST /api/openings/claims/:claimId/reject - either party rejects (reason required)
   body: { reason } */
router.post('/claims/:claimId/reject', requireAuth, async (req, res) => {
  const { reason } = req.body || {};
  if (!reason || reason.trim().length < 3) {
    return res.status(400).json({ error: 'A rejection reason is required' });
  }

  const userClient = supabaseAsUser(req.token);
  const { data, error } = await userClient.rpc('reject_claim', {
    p_claim_id: req.params.claimId,
    p_reason: reason.trim(),
  });

  if (error) return res.status(400).json({ error: mapDbError(error.message) });
  res.json(data);
});

/* friendly DB error messages */
function mapDbError(msg = '') {
  if (msg.includes('INSUFFICIENT_RP')) return 'You do not have enough RP to confirm this referral.';
  if (msg.includes('NOT_AUTHORISED')) return 'You are not allowed to do this.';
  if (msg.includes('CLAIM_ALREADY_DECIDED')) return 'This claim was already decided.';
  if (msg.includes('PROOF_NOT_SUBMITTED')) return 'The referrer has not submitted proof yet.';
  if (msg.includes('PROOF_REQUIRED')) return 'Proof is required.';
  if (msg.includes('CLAIM_NOT_FOUND')) return 'Claim not found.';
  if (msg.includes('OPENING_NOT_FOUND')) return 'Opening not found.';
  if (msg.includes('REASON_REQUIRED')) return 'A rejection reason is required.';
  return msg;
}

export default router;

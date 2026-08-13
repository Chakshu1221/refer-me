import { Router } from 'express';
import crypto from 'crypto';
import { supabaseAdmin, supabaseAsUser } from '../config/supabase.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

/**
 * POST /api/offers
 * A referrer submits an offer for a request.
 * PROOF IS MANDATORY — no proof_url => rejected outright.
 * body: { request_id, proof_url, message }
 */
router.post('/', requireAuth, async (req, res) => {
  const { request_id, proof_url, message } = req.body || {};

  if (!request_id) return res.status(400).json({ error: 'request_id is required' });
  if (!proof_url || !proof_url.trim()) {
    return res.status(400).json({ error: 'Proof of referral is mandatory' });
  }

  // load the request
  const { data: request, error: reqErr } = await supabaseAdmin
    .from('referral_requests')
    .select('*')
    .eq('id', request_id)
    .single();

  if (reqErr || !request) return res.status(404).json({ error: 'Request not found' });
  if (request.status !== 'open') {
    return res.status(400).json({ error: 'This request is no longer open' });
  }
  if (request.requester_id === req.user.id) {
    return res.status(400).json({ error: 'You cannot refer your own request' });
  }

  // hash the proof URL to help catch reused/recycled proofs later
  const proof_hash = crypto.createHash('sha256').update(proof_url.trim()).digest('hex');

  const { data, error } = await supabaseAdmin
    .from('referral_offers')
    .insert({
      request_id,
      referrer_id: req.user.id,
      proof_url: proof_url.trim(),
      proof_hash,
      message: message || null,
    })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      return res.status(409).json({ error: 'You have already offered on this request' });
    }
    return res.status(500).json({ error: error.message });
  }

  res.status(201).json(data);
});

/** GET /api/offers/mine — offers I (as referrer) have made */
router.get('/mine', requireAuth, async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from('referral_offers')
    .select('*, request:referral_requests(id, company_name, role_title, rp_cost, status)')
    .eq('referrer_id', req.user.id)
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

/**
 * POST /api/offers/:id/approve
 * Only the requester can approve. Runs the atomic RPC that does the
 * plain transfer: deduct rp_cost from requester, credit referrer.
 * We run it AS THE USER so auth.uid() inside the function is correct.
 */
router.post('/:id/approve', requireAuth, async (req, res) => {
  const userClient = supabaseAsUser(req.token);
  const { data, error } = await userClient.rpc('approve_offer', {
    p_offer_id: req.params.id,
  });

  if (error) return res.status(400).json({ error: mapDbError(error.message) });
  res.json(data);
});

/**
 * POST /api/offers/:id/reject
 * Only the requester can reject. Reason is mandatory.
 * body: { reason }
 */
router.post('/:id/reject', requireAuth, async (req, res) => {
  const { reason } = req.body || {};
  if (!reason || reason.trim().length < 3) {
    return res.status(400).json({ error: 'A rejection reason is required' });
  }

  const userClient = supabaseAsUser(req.token);
  const { data, error } = await userClient.rpc('reject_offer', {
    p_offer_id: req.params.id,
    p_reason: reason.trim(),
  });

  if (error) return res.status(400).json({ error: mapDbError(error.message) });
  res.json(data);
});

/** Turn raw Postgres exceptions into friendly messages */
function mapDbError(msg = '') {
  if (msg.includes('INSUFFICIENT_RP')) return 'You do not have enough RP to approve this referral.';
  if (msg.includes('NOT_AUTHORISED')) return 'Only the request owner can do this.';
  if (msg.includes('OFFER_ALREADY_DECIDED')) return 'This offer was already decided.';
  if (msg.includes('REQUEST_NOT_OPEN')) return 'This request is no longer open.';
  if (msg.includes('PROOF_REQUIRED')) return 'Proof is required before approval.';
  if (msg.includes('OFFER_NOT_FOUND')) return 'Offer not found.';
  if (msg.includes('REASON_REQUIRED')) return 'A rejection reason is required.';
  return msg;
}

export default router;

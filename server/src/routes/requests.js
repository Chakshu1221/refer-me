import { Router } from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
const MAX_OPEN = Number(process.env.MAX_OPEN_REQUESTS || 5);

/* requester fields exposed publicly on requests (now includes is_premium) */
const REQUESTER_JOIN =
  'requester:profiles!referral_requests_requester_id_fkey(id, full_name, avatar_url, current_company, trust_score, is_premium)';

/**
 * GET /api/requests
 * Browse all OPEN requests (the referral marketplace).
 * Optional query: ?company= &q=
 */
router.get('/', requireAuth, async (req, res) => {
  let query = supabaseAdmin
    .from('referral_requests')
    .select(`*, ${REQUESTER_JOIN}`)
    .eq('status', 'open')
    .order('created_at', { ascending: false });

  if (req.query.company) query = query.ilike('company_name', `%${req.query.company}%`);
  if (req.query.q) query = query.ilike('role_title', `%${req.query.q}%`);

  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

/** GET /api/requests/mine — requests created by me */
router.get('/mine', requireAuth, async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from('referral_requests')
    .select('*')
    .eq('requester_id', req.user.id)
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

/** GET /api/requests/:id — single request + its offers */
router.get('/:id', requireAuth, async (req, res) => {
  const { data: request, error } = await supabaseAdmin
    .from('referral_requests')
    .select(`*, ${REQUESTER_JOIN}`)
    .eq('id', req.params.id)
    .single();

  if (error) return res.status(404).json({ error: 'Request not found' });

  // Only the owner sees the offer list
  let offers = [];
  if (request.requester_id === req.user.id) {
    const { data: off } = await supabaseAdmin
      .from('referral_offers')
      .select('*, referrer:profiles!referral_offers_referrer_id_fkey(id, full_name, avatar_url, current_company, trust_score, is_premium)')
      .eq('request_id', request.id)
      .order('created_at', { ascending: false });
    offers = off || [];
  }

  res.json({ request, offers, is_owner: request.requester_id === req.user.id });
});

/** POST /api/requests — create a referral request */
router.post('/', requireAuth, async (req, res) => {
  const {
    company_name, role_title, job_link,
    jd_doc_url, resume_url, notes, rp_cost,
  } = req.body || {};

  if (!company_name || !role_title) {
    return res.status(400).json({ error: 'company_name and role_title are required' });
  }

  // enforce daily/open cap so nobody spams
  const { count } = await supabaseAdmin
    .from('referral_requests')
    .select('id', { count: 'exact', head: true })
    .eq('requester_id', req.user.id)
    .eq('status', 'open');

  if ((count || 0) >= MAX_OPEN) {
    return res.status(429).json({
      error: `You already have ${MAX_OPEN} open requests. Close one before posting more.`,
    });
  }

  const cost = Math.min(500, Math.max(10, Number(rp_cost) || 50));

  // guard: cannot promise more RP than you currently hold
  const { data: me, error: meErr } = await supabaseAdmin
    .from('profiles')
    .select('rp_balance')
    .eq('id', req.user.id)
    .single();
  if (meErr) return res.status(500).json({ error: meErr.message });
  if (cost > (me?.rp_balance ?? 0)) {
    return res.status(400).json({
      error: `You only have ${me?.rp_balance ?? 0} RP. Set a reward you can afford.`,
    });
  }

  const { data, error } = await supabaseAdmin
    .from('referral_requests')
    .insert({
      requester_id: req.user.id,
      company_name,
      role_title,
      job_link: job_link || null,
      jd_doc_url: jd_doc_url || null,
      resume_url: resume_url || null,
      notes: notes || null,
      rp_cost: cost,
    })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

/** PATCH /api/requests/:id/close — owner closes a request */
router.patch('/:id/close', requireAuth, async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from('referral_requests')
    .update({ status: 'closed' })
    .eq('id', req.params.id)
    .eq('requester_id', req.user.id)
    .eq('status', 'open')
    .select()
    .single();

  if (error) return res.status(400).json({ error: 'Could not close request' });
  res.json(data);
});

export default router;

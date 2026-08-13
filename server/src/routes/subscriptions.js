import { Router } from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

const PLANS = {
  monthly: { label: 'Premium Monthly', price_inr: 199, days: 30 },
  yearly:  { label: 'Premium Yearly',  price_inr: 1799, days: 365 },
};

/** GET /api/subscriptions/plans — public plan catalogue */
router.get('/plans', (_req, res) => res.json(PLANS));

/** GET /api/subscriptions/me — my active subscription (if any) */
router.get('/me', requireAuth, async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from('subscriptions')
    .select('*')
    .eq('user_id', req.user.id)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data || null);
});

/**
 * POST /api/subscriptions/activate
 * Placeholder activation. In production this is driven by a Razorpay
 * webhook AFTER payment succeeds — never trust the client to self-upgrade.
 * body: { plan: 'monthly' | 'yearly', provider_id }
 */
router.post('/activate', requireAuth, async (req, res) => {
  const { plan, provider_id } = req.body || {};
  if (!PLANS[plan]) return res.status(400).json({ error: 'Invalid plan' });

  const end = new Date();
  end.setDate(end.getDate() + PLANS[plan].days);

  const { data, error } = await supabaseAdmin
    .from('subscriptions')
    .insert({
      user_id: req.user.id,
      plan,
      status: 'active',
      provider_id: provider_id || null,
      end_date: end.toISOString(),
    })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });

  await supabaseAdmin
    .from('profiles')
    .update({ is_premium: true, premium_expiry: end.toISOString() })
    .eq('id', req.user.id);

  res.status(201).json(data);
});

export default router;

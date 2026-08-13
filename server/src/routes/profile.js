import { Router } from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

/** GET /api/profile/me — current user's profile */
router.get('/me', requireAuth, async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .eq('id', req.user.id)
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

/** PUT /api/profile/me — complete / update profile */
router.put('/me', requireAuth, async (req, res) => {
  const {
    full_name, current_company, role_title,
    seniority, linkedin_url, avatar_url,
  } = req.body || {};

  if (!full_name || !current_company || !role_title) {
    return res.status(400).json({
      error: 'full_name, current_company and role_title are required',
    });
  }

  const { data, error } = await supabaseAdmin
    .from('profiles')
    .update({
      full_name,
      current_company,
      role_title,
      seniority: seniority || null,
      linkedin_url: linkedin_url || null,
      avatar_url: avatar_url || null,
      profile_complete: true,
    })
    .eq('id', req.user.id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

/** GET /api/profile/:id — public view of any profile */
router.get('/:id', requireAuth, async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('id, full_name, avatar_url, current_company, role_title, seniority, linkedin_url, trust_score, is_premium')
    .eq('id', req.params.id)
    .single();

  if (error) return res.status(404).json({ error: 'Profile not found' });
  res.json(data);
});

export default router;

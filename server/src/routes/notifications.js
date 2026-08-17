import { Router } from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

/* GET /api/notifications - latest 30 for me */
router.get('/', requireAuth, async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from('notifications')
    .select('*')
    .eq('user_id', req.user.id)
    .order('created_at', { ascending: false })
    .limit(30);

  if (error) return res.status(500).json({ error: error.message });
  res.json(data || []);
});

/* GET /api/notifications/unread-count */
router.get('/unread-count', requireAuth, async (req, res) => {
  const { count, error } = await supabaseAdmin
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', req.user.id)
    .eq('read', false);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ count: count || 0 });
});

/* POST /api/notifications/:id/read */
router.post('/:id/read', requireAuth, async (req, res) => {
  const { error } = await supabaseAdmin
    .from('notifications')
    .update({ read: true })
    .eq('id', req.params.id)
    .eq('user_id', req.user.id);

  if (error) return res.status(400).json({ error: error.message });
  res.json({ ok: true });
});

/* POST /api/notifications/read-all */
router.post('/read-all', requireAuth, async (req, res) => {
  const { error } = await supabaseAdmin
    .from('notifications')
    .update({ read: true })
    .eq('user_id', req.user.id)
    .eq('read', false);

  if (error) return res.status(400).json({ error: error.message });
  res.json({ ok: true });
});

export default router;

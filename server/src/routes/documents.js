import { Router } from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

const MAX_DOCS = 20; // sane cap per user

/** GET /api/documents — list my saved documents */
router.get('/', requireAuth, async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from('user_documents')
    .select('*')
    .eq('user_id', req.user.id)
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data || []);
});

/**
 * POST /api/documents — save a document already uploaded to Cloudinary
 * body: { name, url, kind }
 */
router.post('/', requireAuth, async (req, res) => {
  const { name, url, kind } = req.body || {};
  if (!name || !name.trim()) return res.status(400).json({ error: 'A document name is required' });
  if (!url || !url.trim()) return res.status(400).json({ error: 'A file is required' });

  const safeKind = ['resume', 'jd', 'other'].includes(kind) ? kind : 'resume';

  // enforce a per-user cap
  const { count } = await supabaseAdmin
    .from('user_documents')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', req.user.id);

  if ((count || 0) >= MAX_DOCS) {
    return res.status(429).json({ error: `You can store up to ${MAX_DOCS} documents. Delete one to add more.` });
  }

  const { data, error } = await supabaseAdmin
    .from('user_documents')
    .insert({
      user_id: req.user.id,
      name: name.trim().slice(0, 80),
      url: url.trim(),
      kind: safeKind,
    })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

/** DELETE /api/documents/:id — remove one of my documents */
router.delete('/:id', requireAuth, async (req, res) => {
  const { error } = await supabaseAdmin
    .from('user_documents')
    .delete()
    .eq('id', req.params.id)
    .eq('user_id', req.user.id);

  if (error) return res.status(400).json({ error: 'Could not delete document' });
  res.json({ ok: true });
});

export default router;

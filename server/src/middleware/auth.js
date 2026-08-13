import { supabaseAdmin } from '../config/supabase.js';

/**
 * Verifies the Supabase JWT sent by the frontend as `Authorization: Bearer <token>`.
 * On success attaches `req.user` (the auth user) and `req.token` (raw JWT).
 */
export async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return res.status(401).json({ error: 'Missing bearer token' });

    const { data, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !data?.user) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    req.user = data.user;
    req.token = token;
    next();
  } catch (err) {
    console.error('[auth] error', err);
    res.status(500).json({ error: 'Auth check failed' });
  }
}

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const { SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY } = process.env;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('[supabase] Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
}

/**
 * Admin client — uses the service role key. Bypasses RLS.
 * Use ONLY on the server for trusted operations.
 */
export const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

/**
 * Build a per-request client scoped to the caller's JWT.
 * This makes RLS + auth.uid() apply for operations we want the
 * user (not the service role) to perform — e.g. RPC approve/reject.
 */
export function supabaseAsUser(jwt) {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${jwt}` } },
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anon) {
  console.warn('[supabase] Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY');
}

/**
 * IMPORTANT: create the client ONCE (module scope) so the whole app
 * shares a single GoTrue instance. Multiple clients = lost/again refresh
 * tokens and "no refresh token" bugs.
 */
export const supabase = createClient(url, anon, {
  auth: {
    persistSession: true,        // keep session in localStorage
    autoRefreshToken: true,      // silently refresh before expiry
    detectSessionInUrl: true,    // needed for Google OAuth redirect
    storageKey: 'refer-me-auth', // stable, app-specific key
    flowType: 'pkce',            // more robust OAuth/refresh flow
  },
});

import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase.js';
import { api } from '../lib/api.js';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const mounted = useRef(true);

  // Load profile but NEVER let a failure block the app.
  async function loadProfile() {
    try {
      const p = await api.getMyProfile();
      if (mounted.current) setProfile(p);
      return p;
    } catch (e) {
      // token might be briefly invalid; don't crash, just leave profile null
      console.warn('[auth] profile load failed:', e?.message);
      if (mounted.current) setProfile(null);
      return null;
    }
  }

  useEffect(() => {
    mounted.current = true;

    // 1) initial session (with a safety timeout so we never hang on blank)
    const safety = setTimeout(() => {
      if (mounted.current) setLoading(false);
    }, 6000);

    supabase.auth.getSession()
      .then(async ({ data }) => {
        if (!mounted.current) return;
        setSession(data.session || null);
        if (data.session) await loadProfile();
      })
      .catch((e) => console.warn('[auth] getSession failed:', e?.message))
      .finally(() => {
        if (mounted.current) setLoading(false);
        clearTimeout(safety);
      });

    // 2) react to every auth event
    const { data: sub } = supabase.auth.onAuthStateChange(async (event, s) => {
      if (!mounted.current) return;

      if (event === 'SIGNED_OUT') {
        setSession(null);
        setProfile(null);
        setLoading(false);
        return;
      }

      // SIGNED_IN, TOKEN_REFRESHED, USER_UPDATED, INITIAL_SESSION
      setSession(s || null);
      if (s) {
        await loadProfile();
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => {
      mounted.current = false;
      clearTimeout(safety);
      sub.subscription.unsubscribe();
    };
  }, []);

  // --- auth actions ---
  const signInWithGoogle = () =>
    supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    });

  const signInWithEmail = (email, password) =>
    supabase.auth.signInWithPassword({ email, password });

  const setPassword = (password) =>
    supabase.auth.updateUser({ password });

  const signOut = async () => {
    try { await supabase.auth.signOut(); }
    catch (e) { console.warn('[auth] signOut:', e?.message); }
    setProfile(null);
    setSession(null);
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        profile,
        loading,
        signInWithGoogle,
        signInWithEmail,
        setPassword,
        signOut,
        refreshProfile: loadProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase.js';
import { api } from '../lib/api.js';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  async function loadProfile() {
    try {
      const p = await api.getMyProfile();
      setProfile(p);
    } catch {
      setProfile(null);
    }
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session) loadProfile().finally(() => setLoading(false));
      else setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      if (s) loadProfile();
      else setProfile(null);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  // --- Google OAuth ---
  const signInWithGoogle = () =>
    supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    });

  // --- Email + password sign-in (existing accounts only; no sign-up) ---
  const signInWithEmail = (email, password) =>
    supabase.auth.signInWithPassword({ email, password });

  // --- Set / change password on the currently logged-in account ---
  // After a Google login, this attaches a password to the SAME account,
  // so next time the user can log in with their Google email + this password.
  const setPassword = (password) =>
    supabase.auth.updateUser({ password });

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
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

import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import './css/auth.css';

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.6l6.7-6.7C35.6 2.6 30.1 0 24 0 14.6 0 6.4 5.4 2.5 13.3l7.8 6C12.2 13.3 17.6 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.1 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.4c-.5 2.9-2.1 5.3-4.6 7l7.2 5.6c4.2-3.9 6.6-9.6 6.6-17.1z" />
      <path fill="#FBBC05" d="M10.3 28.7c-.5-1.4-.8-2.9-.8-4.7s.3-3.3.8-4.7l-7.8-6C.9 16.4 0 20.1 0 24s.9 7.6 2.5 10.7l7.8-6z" />
      <path fill="#34A853" d="M24 48c6.1 0 11.3-2 15-5.5l-7.2-5.6c-2 1.4-4.6 2.2-7.8 2.2-6.4 0-11.8-3.8-13.7-9.2l-7.8 6C6.4 42.6 14.6 48 24 48z" />
    </svg>
  );
}

const inputStyle = {
  width: '100%', padding: '12px 14px', fontSize: 14,
  border: '1px solid var(--border)', borderRadius: 12, background: '#fff',
  fontFamily: 'inherit', marginBottom: 10,
};

export default function Login() {
  const { session, signInWithGoogle, signInWithEmail, loading } = useAuth();
  const [busyG, setBusyG] = useState(false);
  const [busyE, setBusyE] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  if (loading) {
    return <div className="auth-loading"><div className="spinner" /></div>;
  }
  if (session) return <Navigate to="/" replace />;

  const handleGoogle = async () => {
    setBusyG(true); setError('');
    try {
      const { error } = await signInWithGoogle();
      if (error) throw error;
    } catch (err) {
      setError(err.message || 'Sign-in failed. Please try again.');
      setBusyG(false);
    }
  };

  const handleEmail = async (e) => {
    e.preventDefault();
    setError('');
    if (!email.trim() || !password) { setError('Enter your email and password.'); return; }
    setBusyE(true);
    try {
      const { error } = await signInWithEmail(email.trim(), password);
      if (error) throw error;
      // success: AuthContext session listener redirects
    } catch (err) {
      setError(err.message || 'Login failed. Check your email/password.');
      setBusyE(false);
    }
  };

  return (
    <div className="auth-wrap">
      {/* LEFT: brand story */}
      <aside className="auth-brand">
        <div className="auth-brand-top">
          <div className="auth-logo">
            <span className="dot">🤝</span>
            <b>Refer<span>Me!</span></b>
          </div>
        </div>

        <div className="auth-headline">
          <h1>Referrals that are <em>fair, mutual &amp; real.</em></h1>
          <p>
            A give-to-get network for working professionals. Help someone get
            referred, and earn the right to be referred yourself.
          </p>

          <div className="auth-feats">
            <div className="auth-feat">
              <span className="ico">⚖️</span>
              <div><h4>Everyone starts equal</h4><p>Fresh accounts begin with the same 100 Referral Points.</p></div>
            </div>
            <div className="auth-feat">
              <span className="ico">🧾</span>
              <div><h4>Proof-backed, no fakes</h4><p>Every referral needs uploaded proof before points move.</p></div>
            </div>
          </div>
        </div>

        <div style={{ position: 'relative', zIndex: 2, fontSize: 13, color: '#9aa6d6' }}>
          © {new Date().getFullYear()} Refer Me!
        </div>
      </aside>

      {/* RIGHT: sign-in */}
      <main className="auth-panel">
        <div className="auth-card">
          <div className="auth-mini-brand">
            <span className="dot">🤝</span>
            <b>Refer<span>Me!</span></b>
          </div>

          <h2>Welcome 👋</h2>
          <p className="sub">Sign in to ask for and give referrals.</p>

          {error && <div className="alert error" style={{ marginBottom: 16 }}>{error}</div>}

          <button className="g-btn" onClick={handleGoogle} disabled={busyG}>
            {busyG ? (
              <><span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> Connecting…</>
            ) : (
              <><GoogleIcon /> Continue with Google</>
            )}
          </button>

          <div className="auth-divider">or sign in with email</div>

          <form onSubmit={handleEmail}>
            <input
              type="email" style={inputStyle} placeholder="Email"
              value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email"
            />
            <input
              type="password" style={inputStyle} placeholder="Password"
              value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password"
            />
            <button
              type="submit" disabled={busyE}
              className="g-btn"
              style={{ background: 'linear-gradient(135deg,#4f46e5,#4338ca)', color: '#fff', border: 'none' }}
            >
              {busyE ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <p className="hint" style={{ marginTop: 12, textAlign: 'center', fontSize: 12.5 }}>
            🔒 New here? Use <b>Continue with Google</b> first. You can set a password
            later in your profile to enable email login.
          </p>

          <div className="auth-chips" style={{ marginTop: 18 }}>
            <span className="auth-chip">🧾 Proof required</span>
            <span className="auth-chip">⚖️ Fair by design</span>
          </div>
        </div>
      </main>
    </div>
  );
}

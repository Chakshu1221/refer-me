import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import './auth.css';

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

export default function Login() {
  const { session, signInWithGoogle, loading } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  if (loading) {
    return (
      <div className="auth-loading">
        <div className="spinner" />
      </div>
    );
  }
  if (session) return <Navigate to="/" replace />;

  const handleGoogle = async () => {
    setBusy(true);
    setError('');
    try {
      const { error } = await signInWithGoogle();
      if (error) throw error;
    } catch (err) {
      setError(err.message || 'Sign-in failed. Please try again.');
      setBusy(false);
    }
  };

  return (
    <div className="auth-wrap">
      {/* -------- LEFT: brand story (laptop/tablet) -------- */}
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
            referred, and earn the right to be referred yourself — no favours
            hoarded, no free-riding.
          </p>

          <div className="auth-feats">
            <div className="auth-feat">
              <span className="ico">⚖️</span>
              <div>
                <h4>Everyone starts equal</h4>
                <p>Fresh accounts begin with the same 100 Referral Points. No head starts, ever.</p>
              </div>
            </div>
            <div className="auth-feat">
              <span className="ico">🧾</span>
              <div>
                <h4>Proof-backed, no fakes</h4>
                <p>Every referral needs uploaded proof before any points change hands.</p>
              </div>
            </div>
            <div className="auth-feat">
              <span className="ico">⚡</span>
              <div>
                <h4>Instant, transparent rewards</h4>
                <p>Approve a referral and points move on the spot — deducted from you, credited to them.</p>
              </div>
            </div>
          </div>

          <div className="auth-stat">
            <span className="rp">⚡</span>
            <div>
              <b>100 RP</b>
              <span>welcome balance on sign-up</span>
            </div>
          </div>
        </div>

        <div style={{ position: 'relative', zIndex: 2, fontSize: 13, color: '#9aa6d6' }}>
          © {new Date().getFullYear()} Refer Me! · Built for professionals who help each other.
        </div>
      </aside>

      {/* -------- RIGHT: sign-in -------- */}
      <main className="auth-panel">
        <div className="auth-card">
          <div className="auth-mini-brand">
            <span className="dot">🤝</span>
            <b>Refer<span>Me!</span></b>
          </div>

          <h2>Welcome 👋</h2>
          <p className="sub">Sign in to ask for and give referrals.</p>

          {error && <div className="alert error" style={{ marginBottom: 16 }}>{error}</div>}

          <button className="g-btn" onClick={handleGoogle} disabled={busy}>
            {busy ? (
              <>
                <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
                Connecting…
              </>
            ) : (
              <>
                <GoogleIcon />
                Continue with Google
              </>
            )}
          </button>

          <div className="auth-divider">SECURE SIGN-IN</div>

          <div className="auth-chips">
            <span className="auth-chip">🔒 Google-only login</span>
            <span className="auth-chip">🧾 Proof required</span>
            <span className="auth-chip">⚖️ Fair by design</span>
          </div>

          <p className="auth-foot">
            By continuing you agree to our <a href="#">Terms</a> and{' '}
            <a href="#">Privacy Policy</a>.<br />
            New here? Your account is created automatically with 100 RP.
          </p>
        </div>
      </main>
    </div>
  );
}

import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Login() {
  const { session, signInWithGoogle, loading } = useAuth();
  if (loading) return <div className="container center">Loading…</div>;
  if (session) return <Navigate to="/" replace />;

  return (
    <div className="hero">
      <h1>Refer<span style={{ color: 'var(--accent)' }}>Me!</span></h1>
      <p>
        A fair, give-to-get referral network for working professionals.
        Help someone get referred, and earn the right to be referred yourself.
      </p>
      <button className="google-btn" onClick={signInWithGoogle}>
        <svg width="18" height="18" viewBox="0 0 48 48">
          <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.6l6.7-6.7C35.6 2.6 30.1 0 24 0 14.6 0 6.4 5.4 2.5 13.3l7.8 6C12.2 13.3 17.6 9.5 24 9.5z"/>
          <path fill="#4285F4" d="M46.1 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.4c-.5 2.9-2.1 5.3-4.6 7l7.2 5.6c4.2-3.9 6.6-9.6 6.6-17.1z"/>
          <path fill="#FBBC05" d="M10.3 28.7c-.5-1.4-.8-2.9-.8-4.7s.3-3.3.8-4.7l-7.8-6C.9 16.4 0 20.1 0 24s.9 7.6 2.5 10.7l7.8-6z"/>
          <path fill="#34A853" d="M24 48c6.1 0 11.3-2 15-5.5l-7.2-5.6c-2 1.4-4.6 2.2-7.8 2.2-6.4 0-11.8-3.8-13.7-9.2l-7.8 6C6.4 42.6 14.6 48 24 48z"/>
        </svg>
        Continue with Google
      </button>
      <p className="hint" style={{ marginTop: 20 }}>
        Everyone starts with 100 RP. Proof is mandatory on every referral.
      </p>
    </div>
  );
}

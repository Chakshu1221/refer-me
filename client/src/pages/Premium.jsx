import { useEffect, useState } from 'react';
import { api } from '../lib/api.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function Premium() {
  const { profile, refreshProfile } = useAuth();
  const [plans, setPlans] = useState(null);
  const [sub, setSub] = useState(null);
  const [busy, setBusy] = useState('');
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    api.plans().then(setPlans);
    api.mySubscription().then(setSub).catch(() => {});
  }, []);

  // NOTE: In production this runs only AFTER a successful Razorpay payment
  // (via webhook). This button is a placeholder to wire the flow.
  const activate = async (plan) => {
    setBusy(plan); setError(''); setMsg('');
    try {
      await api.activatePlan(plan);
      setMsg('Premium activated!');
      await refreshProfile();
      setSub(await api.mySubscription());
    } catch (err) { setError(err.message); }
    finally { setBusy(''); }
  };

  return (
    <div className="container" style={{ maxWidth: 720 }}>
      <h2>Premium</h2>
      <p className="hint">
        Premium never gives you free RP — the core stays equal for everyone.
        It raises your limits and adds convenience once you outgrow the free tier.
      </p>

      {profile?.is_premium && (
        <div className="alert success">
          You're Premium 🎉 {sub?.end_date && `until ${new Date(sub.end_date).toLocaleDateString()}`}
        </div>
      )}
      {msg && <div className="alert success">{msg}</div>}
      {error && <div className="alert error">{error}</div>}

      <div className="card">
        <h3>What Premium adds</h3>
        <ul>
          <li>Higher daily request limit + faster RP refill</li>
          <li>Priority placement in referrer feeds</li>
          <li>Advanced search & filters (company, seniority, location)</li>
          <li>Larger Cloudinary storage — resume & doc vault</li>
          <li>“Verified Pro” trust badge</li>
        </ul>
      </div>

      {plans && (
        <div className="grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
          {Object.entries(plans).map(([key, p]) => (
            <div className="card" key={key}>
              <h3>{p.label}</h3>
              <p style={{ fontSize: 28, fontWeight: 700, margin: '6px 0' }}>
                ₹{p.price_inr}
                <span style={{ fontSize: 14, color: 'var(--muted)' }}>
                  {key === 'monthly' ? '/mo' : '/yr'}
                </span>
              </p>
              <button
                className="btn"
                disabled={busy === key || profile?.is_premium}
                onClick={() => activate(key)}
              >
                {busy === key ? 'Activating…' : profile?.is_premium ? 'Active' : 'Choose plan'}
              </button>
            </div>
          ))}
        </div>
      )}
      <p className="hint">Payments via Razorpay (to be wired). This demo activates instantly.</p>
    </div>
  );
}

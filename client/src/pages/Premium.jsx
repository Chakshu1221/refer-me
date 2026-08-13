import { useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import './css/app.css';
import './css/premium.css';

const PLAN_FEATURES = [
  'Higher daily request limit',
  'Faster RP refill',
  'Priority placement in referrer feeds',
  'Advanced search & filters',
  'Larger resume & document vault',
  '“Verified Pro” trust badge',
];

const COMPARE = [
  ['Referral requests', 'RP + daily cap', 'Higher cap'],
  ['RP refill speed', 'Standard', 'Faster'],
  ['Feed placement', 'Standard', 'Priority'],
  ['Advanced filters', 'no', 'yes'],
  ['Response analytics', 'no', 'yes'],
  ['Verified Pro badge', 'no', 'yes'],
  ['Proof-backed & equal core', 'yes', 'yes'],
];

const FAQ = [
  ['Does Premium give me free Referral Points?', 'No. The core economy stays equal for everyone — RP is only earned by genuinely helping people. Premium raises limits and adds convenience, never free points.'],
  ['Can I cancel anytime?', 'Yes. Your Premium benefits remain active until the end of your billing period, then your account simply returns to the free tier.'],
  ['How is payment handled?', 'Payments are processed securely via Razorpay. Your Premium is activated automatically once payment succeeds.'],
];

export default function Premium() {
  const { profile, refreshProfile } = useAuth();
  const [plans, setPlans] = useState(null);
  const [sub, setSub] = useState(null);
  const [cycle, setCycle] = useState('yearly');
  const [busy, setBusy] = useState('');
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    api.plans().then(setPlans).catch(() => {});
    api.mySubscription().then(setSub).catch(() => {});
  }, []);

  const savePct = useMemo(() => {
    if (!plans?.monthly || !plans?.yearly) return 0;
    const yearlyIfMonthly = plans.monthly.price_inr * 12;
    return Math.round((1 - plans.yearly.price_inr / yearlyIfMonthly) * 100);
  }, [plans]);

  // In production this runs only AFTER a successful Razorpay payment (webhook).
  const activate = async (plan) => {
    setBusy(plan); setError(''); setMsg('');
    try {
      await api.activatePlan(plan);
      setMsg('🎉 Premium activated! Enjoy your upgraded limits.');
      await refreshProfile();
      setSub(await api.mySubscription());
    } catch (err) { setError(err.message); }
    finally { setBusy(''); }
  };

  const isPremium = !!profile?.is_premium;
  const monthly = plans?.monthly;
  const yearly = plans?.yearly;

  return (
    <div className="page">
      {/* HERO */}
      <div className="pr-hero">
        <span className="crown">👑</span>
        <h1>Refer Me! Premium</h1>
        <p>
          Do more, faster — without ever breaking fairness. Premium raises your
          limits and adds power features. The give-to-get core stays equal for everyone.
        </p>
        {isPremium && (
          <div className="pr-active-banner">
            💎 You're Premium
            {sub?.end_date && ` · renews ${new Date(sub.end_date).toLocaleDateString()}`}
          </div>
        )}
      </div>

      {msg && <div className="alert success" style={{ marginBottom: 16 }}>{msg}</div>}
      {error && <div className="alert error" style={{ marginBottom: 16 }}>{error}</div>}

      {/* BILLING TOGGLE */}
      <div className="pr-toggle-wrap">
        <div className="pr-toggle">
          <button className={cycle === 'monthly' ? 'active' : ''} onClick={() => setCycle('monthly')}>
            Monthly
          </button>
          <button className={cycle === 'yearly' ? 'active' : ''} onClick={() => setCycle('yearly')}>
            Yearly
            {savePct > 0 && <span className="pr-save-badge">SAVE {savePct}%</span>}
          </button>
        </div>
      </div>

      {/* PLAN CARDS */}
      <div className="pr-plans">
        {/* Free */}
        <div className="plan">
          <h3>Free</h3>
          <p className="plan-sub">Everything you need to give &amp; get referrals.</p>
          <div className="plan-price">
            <span className="cur">₹</span><span className="amt">0</span><span className="per">/forever</span>
          </div>
          <div className="plan-equiv">Everyone starts here with 100 RP</div>
          <ul className="plan-feats">
            <li><span className="ck">✓</span> Ask for &amp; give referrals</li>
            <li><span className="ck">✓</span> 100 RP welcome balance</li>
            <li><span className="ck">✓</span> Proof-backed approvals</li>
            <li><span className="ck">✓</span> Standard daily request cap</li>
          </ul>
          <button className="plan-btn ghost" disabled>
            {isPremium ? 'Included' : 'Your current plan'}
          </button>
        </div>

        {/* Premium (reacts to cycle) */}
        <div className="plan featured">
          <span className="plan-tag">⭐ MOST POPULAR</span>
          <h3>Premium {cycle === 'yearly' ? '· Yearly' : '· Monthly'}</h3>
          <p className="plan-sub">For power users who help a lot.</p>
          <div className="plan-price">
            <span className="cur">₹</span>
            <span className="amt">
              {cycle === 'yearly' ? (yearly?.price_inr ?? '—') : (monthly?.price_inr ?? '—')}
            </span>
            <span className="per">/{cycle === 'yearly' ? 'year' : 'month'}</span>
          </div>
          <div className="plan-equiv">
            {cycle === 'yearly' && yearly?.price_inr
              ? `≈ ₹${Math.round(yearly.price_inr / 12)}/mo · save ${savePct}%`
              : 'Billed monthly · cancel anytime'}
          </div>
          <ul className="plan-feats">
            {PLAN_FEATURES.map((f) => (
              <li key={f}><span className="ck">✓</span> {f}</li>
            ))}
          </ul>
          <button
            className="plan-btn primary"
            disabled={isPremium || busy === cycle}
            onClick={() => activate(cycle)}
          >
            {isPremium
              ? '✓ Active'
              : busy === cycle
                ? 'Activating…'
                : `Upgrade — ₹${cycle === 'yearly' ? (yearly?.price_inr ?? '') : (monthly?.price_inr ?? '')}`}
          </button>
        </div>
      </div>

      {/* FAIRNESS CALLOUT */}
      <div className="fair-callout">
        <span className="fic">⚖️</span>
        <div>
          <h4>Fairness stays sacred</h4>
          <p>
            Premium never grants free Referral Points and never lets anyone skip helping others.
            It only raises ceilings and adds convenience — so the core of Refer Me! remains equal
            for every member, paid or not.
          </p>
        </div>
      </div>

      {/* COMPARISON */}
      <h2 className="pr-compare-title">Free vs Premium</h2>
      <div className="compare">
        <div className="compare-row head">
          <div className="compare-feat">Feature</div>
          <div className="col-pr">Free</div>
          <div className="col-pr">Premium</div>
        </div>
        {COMPARE.map(([feat, free, prem]) => (
          <div className="compare-row" key={feat}>
            <div className="compare-feat">{feat}</div>
            <div className={`compare-cell ${free === 'yes' ? 'yes' : free === 'no' ? 'no' : ''}`}>
              {free === 'yes' ? '✓' : free === 'no' ? '✕' : free}
            </div>
            <div className={`compare-cell ${prem === 'yes' ? 'yes' : prem === 'no' ? 'no' : ''}`}>
              {prem === 'yes' ? '✓' : prem === 'no' ? '✕' : prem}
            </div>
          </div>
        ))}
      </div>

      {/* FAQ */}
      <div className="pr-faq">
        <h2>Questions</h2>
        {FAQ.map(([q, a]) => (
          <div className="faq-item" key={q}>
            <b>{q}</b>
            <p>{a}</p>
          </div>
        ))}
      </div>

      <p className="setup-hint" style={{ textAlign: 'center', marginTop: 20, color: 'var(--muted)', fontSize: 12.5 }}>
        Payments via Razorpay (to be wired). This demo activates instantly.
      </p>
    </div>
  );
}

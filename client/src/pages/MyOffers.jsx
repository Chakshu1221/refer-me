import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api.js';

export default function MyOffers() {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.myOffers().then(setOffers).finally(() => setLoading(false));
  }, []);

  return (
    <div className="container">
      <h2>My referral offers</h2>
      <p className="hint">Offers you've made to refer others. RP is credited when approved.</p>

      {loading ? <p className="hint">Loading…</p> : offers.length === 0 ? (
        <p className="hint">You haven't offered any referrals yet. <Link to="/browse">Browse requests →</Link></p>
      ) : (
        <div className="grid">
          {offers.map((o) => (
            <div className="card" key={o.id}>
              <div className="row" style={{ justifyContent: 'space-between' }}>
                <h3 style={{ margin: 0 }}>{o.request?.role_title || 'Request'}</h3>
                <span className={`badge ${o.status}`}>{o.status}</span>
              </div>
              <p className="meta">
                {o.request?.company_name} · Reward {o.request?.rp_cost} RP
              </p>
              <a href={o.proof_url} target="_blank" rel="noreferrer">🧾 Proof</a>
              {o.status === 'rejected' && o.rejection_reason && (
                <p className="hint">Rejected: {o.rejection_reason}</p>
              )}
              {o.status === 'approved' && (
                <p className="hint" style={{ color: 'var(--success)' }}>
                  ✅ +{o.request?.rp_cost} RP credited
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

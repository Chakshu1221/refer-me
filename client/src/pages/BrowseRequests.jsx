import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api.js';

export default function BrowseRequests() {
  const [items, setItems] = useState([]);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);

  const load = async (query = '') => {
    setLoading(true);
    try {
      const params = query ? `?q=${encodeURIComponent(query)}` : '';
      setItems(await api.browseRequests(params));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  return (
    <div className="container">
      <h2>Open referral requests</h2>
      <p className="hint">Refer someone at your company, upload proof, and earn RP when they approve.</p>

      <div className="row" style={{ margin: '12px 0' }}>
        <input
          placeholder="Search by role…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && load(q)}
          style={{ maxWidth: 320 }}
        />
        <button className="btn small" onClick={() => load(q)}>Search</button>
      </div>

      {loading ? <p className="hint">Loading…</p> : items.length === 0 ? (
        <p className="hint">No open requests right now.</p>
      ) : (
        <div className="grid">
          {items.map((r) => (
            <Link to={`/request/${r.id}`} key={r.id} className="card" style={{ color: 'inherit' }}>
              <div className="row" style={{ justifyContent: 'space-between' }}>
                <h3 style={{ margin: 0 }}>{r.role_title}</h3>
                <span className="rp-pill">⚡ {r.rp_cost} RP</span>
              </div>
              <p className="meta">{r.company_name}</p>
              {r.requester && (
                <p className="meta">
                  Asked by {r.requester.full_name} · Trust {r.requester.trust_score}
                </p>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

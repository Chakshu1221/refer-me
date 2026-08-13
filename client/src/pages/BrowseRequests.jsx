import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api.js';
import './css/app.css';
import './css/browse.css';

/* deterministic colour for a company logo tile */
const LOGO_COLORS = [
  'linear-gradient(135deg,#6366f1,#4338ca)',
  'linear-gradient(135deg,#f59e0b,#f97316)',
  'linear-gradient(135deg,#10b981,#059669)',
  'linear-gradient(135deg,#ec4899,#be185d)',
  'linear-gradient(135deg,#06b6d4,#0891b2)',
  'linear-gradient(135deg,#8b5cf6,#6d28d9)',
];
const pickColor = (s = '') => LOGO_COLORS[[...s].reduce((a, c) => a + c.charCodeAt(0), 0) % LOGO_COLORS.length];

function trustLevel(t = 100) {
  if (t >= 90) return 'hi';
  if (t >= 60) return 'mid';
  return 'lo';
}

export default function BrowseRequests() {
  const [items, setItems] = useState([]);
  const [q, setQ] = useState('');
  const [company, setCompany] = useState('');
  const [sort, setSort] = useState('recent');
  const [reward, setReward] = useState('all'); // all | high | low
  const [loading, setLoading] = useState(true);

  const load = async (query = '', comp = '') => {
    setLoading(true);
    try {
      const parts = [];
      if (query) parts.push(`q=${encodeURIComponent(query)}`);
      if (comp) parts.push(`company=${encodeURIComponent(comp)}`);
      const qs = parts.length ? `?${parts.join('&')}` : '';
      setItems(await api.browseRequests(qs));
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const view = useMemo(() => {
    let list = [...items];
    if (reward === 'high') list = list.filter((r) => r.rp_cost >= 100);
    if (reward === 'low') list = list.filter((r) => r.rp_cost < 100);
    if (sort === 'recent') list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    if (sort === 'reward') list.sort((a, b) => b.rp_cost - a.rp_cost);
    return list;
  }, [items, reward, sort]);

  const onSearch = () => load(q, company);

  return (
    <div className="page">
      {/* SEARCH HERO */}
      <div className="browse-hero">
        <h1>Find someone to help 🔎</h1>
        <p>Refer a professional at your company, upload proof, and earn Referral Points.</p>
        <div className="search-bar">
          <div className="search-field">
            <span className="ic">💼</span>
            <input
              placeholder="Role or keyword (e.g. QA Engineer)"
              value={q} onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && onSearch()}
            />
          </div>
          <div className="search-field">
            <span className="ic">🏢</span>
            <input
              placeholder="Company"
              value={company} onChange={(e) => setCompany(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && onSearch()}
            />
          </div>
          <button className="search-go" onClick={onSearch}>Search</button>
        </div>
      </div>

      {/* TOOLBAR */}
      <div className="browse-toolbar">
        <span className="browse-count">
          <b>{loading ? '…' : view.length}</b> open request{view.length === 1 ? '' : 's'}
        </span>
        <div className="filter-chips">
          <button className={`fchip ${reward === 'all' ? 'active' : ''}`} onClick={() => setReward('all')}>All</button>
          <button className={`fchip ${reward === 'high' ? 'active' : ''}`} onClick={() => setReward('high')}>💎 100+ RP</button>
          <button className={`fchip ${reward === 'low' ? 'active' : ''}`} onClick={() => setReward('low')}>Under 100 RP</button>
        </div>
        <div className="browse-sort">
          <select value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="recent">Newest first</option>
            <option value="reward">Highest reward</option>
          </select>
        </div>
      </div>

      {/* RESULTS */}
      {loading ? (
        <div className="browse-grid">
          {[0, 1, 2].map((i) => <div key={i} className="skeleton sk-card" style={{ height: 180 }} />)}
        </div>
      ) : view.length === 0 ? (
        <div className="empty">
          <div className="em">🕵️</div>
          <h3>No open requests found</h3>
          <p>Try a different keyword or clear the filters.</p>
          <button className="btn-cta" onClick={() => { setQ(''); setCompany(''); setReward('all'); load(); }}>
            ↻ Reset search
          </button>
        </div>
      ) : (
        <div className="browse-grid">
          {view.map((r) => {
            const asker = r.requester || {};
            const initials = (asker.full_name || '?').split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();
            return (
              <Link to={`/request/${r.id}`} key={r.id} className="job-card">
                <div className="job-head">
                  <div className="company-logo" style={{ background: pickColor(r.company_name) }}>
                    {(r.company_name || '?')[0].toUpperCase()}
                  </div>
                  <div className="job-title">
                    <h3>{r.role_title}</h3>
                    <span className="co">🏢 {r.company_name}</span>
                  </div>
                </div>

                {r.notes && <p className="job-notes">{r.notes}</p>}

                <div className="job-docs">
                  {r.resume_url && <span className="doc-tag">📄 Resume</span>}
                  {r.jd_doc_url && <span className="doc-tag">📑 JD</span>}
                  {r.job_link && <span className="doc-tag">🔗 Link</span>}
                </div>

                <div className="job-foot">
                  <div className="asker">
                    {asker.avatar_url
                      ? <img className="asker-av" src={asker.avatar_url} alt="" />
                      : <div className="asker-av">{initials}</div>}
                    <div className="asker-info">
                      <b>{asker.full_name || 'Someone'}{asker.is_premium && <span title="Premium member"> 💎</span>}</b>
                      <span>
                        <span className={`trust-dot ${trustLevel(asker.trust_score)}`} />
                        Trust {asker.trust_score ?? 100}
                      </span>
                    </div>
                  </div>
                  <span className="job-reward">⚡ {r.rp_cost}</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api.js';
import './css/app.css';
import './css/browse.css';
import './css/openings.css';

const LOGO_COLORS = [
  'linear-gradient(135deg,#6366f1,#4338ca)',
  'linear-gradient(135deg,#f59e0b,#f97316)',
  'linear-gradient(135deg,#10b981,#059669)',
  'linear-gradient(135deg,#ec4899,#be185d)',
  'linear-gradient(135deg,#06b6d4,#0891b2)',
  'linear-gradient(135deg,#8b5cf6,#6d28d9)',
];
const pickColor = (s = '') => LOGO_COLORS[[...s].reduce((a, c) => a + c.charCodeAt(0), 0) % LOGO_COLORS.length];
const trustLevel = (t = 100) => (t >= 90 ? 'hi' : t >= 60 ? 'mid' : 'lo');

export default function BrowseOpenings() {
  const [items, setItems] = useState([]);
  const [q, setQ] = useState('');
  const [company, setCompany] = useState('');
  const [loading, setLoading] = useState(true);

  const load = async (query = '', comp = '') => {
    setLoading(true);
    try {
      const parts = [];
      if (query) parts.push(`q=${encodeURIComponent(query)}`);
      if (comp) parts.push(`company=${encodeURIComponent(comp)}`);
      const qs = parts.length ? `?${parts.join('&')}` : '';
      setItems(await api.browseOpenings(qs));
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const onSearch = () => load(q, company);

  return (
    <div className="page">
      <div className="browse-hero">
        <h1>Grab a referral 🎁</h1>
        <p>Professionals are offering to refer people at their companies. Grab one with your resume.</p>
        <div className="search-bar">
          <div className="search-field">
            <span className="ic">💼</span>
            <input placeholder="Role or keyword" value={q}
              onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && onSearch()} />
          </div>
          <div className="search-field">
            <span className="ic">🏢</span>
            <input placeholder="Company" value={company}
              onChange={(e) => setCompany(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && onSearch()} />
          </div>
          <button className="search-go" onClick={onSearch}>Search</button>
        </div>
      </div>

      {/* marketplace toggle */}
      <div className="mk-toggle">
        <Link to="/browse">🙋 Requests</Link>
        <Link to="/openings" className="active">🎁 Openings</Link>
      </div>

      <div className="browse-toolbar">
        <span className="browse-count"><b>{loading ? '…' : items.length}</b> open opening{items.length === 1 ? '' : 's'}</span>
        <Link to="/offer" className="btn-cta" style={{ marginLeft: 'auto' }}>➕ Offer a referral</Link>
      </div>

      {loading ? (
        <div className="browse-grid">
          {[0, 1, 2].map((i) => <div key={i} className="skeleton" style={{ height: 180, borderRadius: 18 }} />)}
        </div>
      ) : items.length === 0 ? (
        <div className="empty">
          <div className="em">🎁</div>
          <h3>No openings right now</h3>
          <p>Be the first to offer a referral at your company.</p>
          <Link to="/offer" className="btn-cta">➕ Offer a referral</Link>
        </div>
      ) : (
        <div className="browse-grid">
          {items.map((o) => {
            const ref = o.referrer || {};
            const initials = (ref.full_name || '?').split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();
            const left = Math.max(0, (o.slots || 1) - (o.slots_filled || 0));
            return (
              <Link to={`/opening/${o.id}`} key={o.id} className="job-card">
                <div className="job-head">
                  <div className="company-logo" style={{ background: pickColor(o.company_name) }}>
                    {(o.company_name || '?')[0].toUpperCase()}
                  </div>
                  <div className="job-title">
                    <h3>{o.role_title}</h3>
                    <span className="co">🏢 {o.company_name}</span>
                  </div>
                </div>

                {o.notes && <p className="job-notes">{o.notes}</p>}

                <div className="job-docs">
                  <span className={`slots-badge ${left <= 1 ? 'low' : ''}`}>🎟️ {left} slot{left === 1 ? '' : 's'} left</span>
                  {o.jd_doc_url && <span className="doc-tag">📑 JD</span>}
                  {o.job_link && <span className="doc-tag">🔗 Link</span>}
                </div>

                <div className="job-foot">
                  <div className="asker">
                    {ref.avatar_url ? <img className="asker-av" src={ref.avatar_url} alt="" /> : <div className="asker-av">{initials}</div>}
                    <div className="asker-info">
                      <b>{ref.full_name || 'Someone'}{ref.is_premium && <span title="Premium"> 💎</span>}</b>
                      <span><span className={`trust-dot ${trustLevel(ref.trust_score)}`} />Trust {ref.trust_score ?? 100}</span>
                    </div>
                  </div>
                  <span className="job-reward">⚡ {o.rp_price}</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { openingsApi } from '../lib/openingsApi.js';
import './css/app.css';
import './css/openings.css';

const initialsOf = (n = '?') => n.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();

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
      setItems(await openingsApi.browse(qs));
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
      {/* marketplace toggle */}
      <div className="mkt-toggle">
        <Link to="/browse">🙋 Requests</Link>
        <Link to="/openings" className="active">🎁 Openings</Link>
      </div>

      <div className="op-hero">
        <h1>Grab a referral opening 🎁</h1>
        <p>People at top companies are offering to refer you. Grab a slot with your resume.</p>
      </div>

      <div className="search-bar" style={{ marginBottom: 16 }}>
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

      {loading ? (
        <div className="op-grid">
          {[0, 1, 2].map((i) => <div key={i} className="skeleton" style={{ height: 180 }} />)}
        </div>
      ) : items.length === 0 ? (
        <div className="empty">
          <div className="em">🎁</div>
          <h3>No openings right now</h3>
          <p>Be the first to offer a referral at your company.</p>
          <Link to="/offer" className="btn-cta">🎁 Offer a referral</Link>
        </div>
      ) : (
        <div className="op-grid">
          {items.map((o) => {
            const left = (o.slots_total ?? 1) - (o.slots_used ?? 0);
            const owner = o.referrer || {};
            return (
              <Link to={`/opening/${o.id}`} key={o.id} className="op-card">
                <div className="op-head">
                  <div className="op-logo">{(o.company_name || '?')[0].toUpperCase()}</div>
                  <div className="op-title">
                    <h3>{o.role_title}</h3>
                    <span className="co">🏢 {o.company_name}</span>
                  </div>
                </div>
                {o.notes && <p className="op-notes">{o.notes}</p>}
                <div className="op-foot">
                  <span className="op-slots">🎟️ {left} slot{left === 1 ? '' : 's'} left</span>
                  <span className="op-price">⚡ {o.rp_price}</span>
                </div>
                <div className="op-owner">
                  {owner.avatar_url
                    ? <img className="av" src={owner.avatar_url} alt="" />
                    : <div className="av">{initialsOf(owner.full_name)}</div>}
                  <b>{owner.full_name || 'Someone'}{owner.is_premium && ' 💎'}</b>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

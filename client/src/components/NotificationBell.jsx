import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api.js';
import '../pages/css/notif.css';

function timeAgo(iso) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export default function NotificationBell() {
  const navigate = useNavigate();
  const wrapRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [count, setCount] = useState(0);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadCount = () => api.unreadCount().then((r) => setCount(r.count || 0)).catch(() => {});

  useEffect(() => {
    loadCount();
    const t = setInterval(loadCount, 30000); // poll every 30s
    return () => clearInterval(t);
  }, []);

  // close on outside click
  useEffect(() => {
    const onDoc = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const toggle = async () => {
    const next = !open;
    setOpen(next);
    if (next) {
      setLoading(true);
      try { setItems(await api.notifications()); } catch { setItems([]); }
      finally { setLoading(false); }
    }
  };

  const openItem = async (n) => {
    setOpen(false);
    if (!n.read) {
      try { await api.markNotifRead(n.id); } catch {}
      setCount((c) => Math.max(0, c - 1));
    }
    if (n.link) navigate(n.link);
  };

  const markAll = async () => {
    try { await api.markAllNotifRead(); } catch {}
    setItems((list) => list.map((n) => ({ ...n, read: true })));
    setCount(0);
  };

  return (
    <div className="nb-wrap" ref={wrapRef}>
      <button className="nb-btn" onClick={toggle} aria-label="Notifications">
        🔔
        {count > 0 && <span className="nb-badge">{count > 9 ? '9+' : count}</span>}
      </button>

      {open && (
        <div className="nb-panel">
          <div className="nb-head">
            <b>Notifications</b>
            {count > 0 && <a onClick={markAll}>Mark all read</a>}
          </div>
          <div className="nb-list">
            {loading ? (
              <div className="nb-empty">Loading…</div>
            ) : items.length === 0 ? (
              <div className="nb-empty"><span className="em">🔔</span>You're all caught up!</div>
            ) : (
              items.map((n) => (
                <div key={n.id} className={`nb-item ${n.read ? '' : 'unread'}`} onClick={() => openItem(n)}>
                  <span className="nb-dot" />
                  <div className="nb-body">
                    <b>{n.title}</b>
                    {n.body && <p>{n.body}</p>}
                    <time>{timeAgo(n.created_at)}</time>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

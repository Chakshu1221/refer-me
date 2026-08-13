import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import '../pages/css/app.css';

const LINKS = [
  { to: '/browse', label: 'Browse' },
  { to: '/create', label: 'Ask' },
  { to: '/my-offers', label: 'My Offers' },
  { to: '/premium', label: 'Premium' },
];

export default function Navbar() {
  const { session, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  if (!session) return null;

  const doSignOut = async () => {
    setOpen(false);
    await signOut();
    navigate('/login');
  };

  const initials = (profile?.full_name || '?')
    .split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();

  return (
    <nav className="nav">
      <div className="nav-inner">
        <NavLink to="/" className="nav-brand" onClick={() => setOpen(false)}>
          <span className="dot">🤝</span>
          Refer<span>Me!</span>
        </NavLink>

        {/* desktop links */}
        <div className="nav-links">
          {LINKS.map((l) => (
            <NavLink key={l.to} to={l.to} className={({ isActive }) => (isActive ? 'active' : '')}>
              {l.label}
            </NavLink>
          ))}
        </div>

        <div className="nav-right">
          {profile && <span className="nav-rp">⚡ {profile.rp_balance} RP</span>}

          {profile?.avatar_url
            ? <img className="nav-avatar" src={profile.avatar_url} alt="me" onClick={() => navigate('/profile')} title="Profile" />
            : <div className="nav-avatar" onClick={() => navigate('/profile')} title="Profile">{initials}</div>}

          {/* desktop-only sign out (hidden on mobile via responsive.css) */}
          <button className="nav-signout" onClick={doSignOut}>Sign out</button>

          {/* mobile menu toggle */}
          <button className="nav-burger" onClick={() => setOpen((o) => !o)} aria-label="Menu">
            {open ? '✕' : '☰'}
          </button>
        </div>
      </div>

      {/* mobile dropdown */}
      <div className={`nav-mobile ${open ? 'open' : ''}`}>
        {LINKS.map((l) => (
          <NavLink
            key={l.to} to={l.to}
            className={({ isActive }) => (isActive ? 'active' : '')}
            onClick={() => setOpen(false)}
          >
            {l.label}
          </NavLink>
        ))}
        <NavLink to="/profile" onClick={() => setOpen(false)}>My Profile</NavLink>
        <a className="nav-mobile-signout" onClick={doSignOut}>Sign out</a>
      </div>
    </nav>
  );
}

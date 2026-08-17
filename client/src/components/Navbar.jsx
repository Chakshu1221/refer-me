import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import '../pages/css/app.css';

const LINKS = [
  { to: '/browse', label: 'Requests' },
  { to: '/openings', label: 'Openings' },
  { to: '/create', label: 'Ask' },
  { to: '/offer', label: 'Offer' },
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
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const goProfile = () => {
    setOpen(false);
    navigate('/profile');
  };

  return (
    <nav className="nav">
      <div className="nav-inner">
        <NavLink to="/" className="nav-brand" onClick={() => setOpen(false)}>
          <span className="dot">🤝</span>
          Refer<span>Me!</span>
        </NavLink>

        <div className="nav-links">
          {LINKS.map((l) => (
            <NavLink key={l.to} to={l.to} className={({ isActive }) => (isActive ? 'active' : '')}>
              {l.label}
            </NavLink>
          ))}
        </div>

        <div className="nav-right">
          {profile && <span className="nav-rp">⚡ {profile.rp_balance} RP</span>}

          {profile?.avatar_url ? (
            <img
              className="nav-avatar"
              src={profile.avatar_url}
              alt="Profile"
              title="Profile"
              onClick={goProfile}
            />
          ) : (
            <div className="nav-avatar" title="Profile" onClick={goProfile}>
              {initials}
            </div>
          )}

          <button className="nav-signout" onClick={doSignOut}>Sign out</button>

          <button
            className="nav-burger"
            onClick={() => setOpen((o) => !o)}
            aria-label="Menu"
            aria-expanded={open}
          >
            {open ? '✕' : '☰'}
          </button>
        </div>
      </div>

      <div className={`nav-mobile ${open ? 'open' : ''}`}>
        {LINKS.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            className={({ isActive }) => (isActive ? 'active' : '')}
            onClick={() => setOpen(false)}
          >
            {l.label}
          </NavLink>
        ))}

        <NavLink to="/profile" onClick={() => setOpen(false)}>
          My Profile
        </NavLink>

        <a className="nav-mobile-signout" onClick={doSignOut}>
          Sign out
        </a>
      </div>
    </nav>
  );
}

import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Navbar() {
  const { session, profile, signOut } = useAuth();
  const navigate = useNavigate();
  if (!session) return null;

  const doSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <NavLink to="/" className="brand">Refer<span>Me!</span></NavLink>
        <div className="nav-links">
          <NavLink to="/browse">Browse</NavLink>
          <NavLink to="/create">Ask</NavLink>
          <NavLink to="/my-offers">My Offers</NavLink>
          <NavLink to="/premium">Premium</NavLink>
          {profile && <span className="rp-pill">⚡ {profile.rp_balance} RP</span>}
          <button className="btn small secondary" onClick={doSignOut}>Sign out</button>
        </div>
      </div>
    </nav>
  );
}

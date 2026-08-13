import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

/**
 * Guards private routes. Also forces profile completion:
 * a signed-in user without a complete profile is sent to /setup.
 */
export default function ProtectedRoute({ children, requireComplete = true }) {
  const { session, profile, loading } = useAuth();

  if (loading) return <div className="container center">Loading…</div>;
  if (!session) return <Navigate to="/login" replace />;
  if (requireComplete && profile && !profile.profile_complete) {
    return <Navigate to="/setup" replace />;
  }
  return children;
}

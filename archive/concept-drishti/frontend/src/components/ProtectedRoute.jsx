/**
 * components/ProtectedRoute.jsx
 *
 * Wraps pages that require authentication and/or specific roles.
 * Role list per frontend.md §3 — must mirror access-control.md exactly.
 *
 * Usage:
 *   <ProtectedRoute roles={['fleet_manager', 'safety_officer']}>
 *     <Drivers />
 *   </ProtectedRoute>
 */

import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, roles = [] }) {
  const { user, loading } = useAuth();

  // Show nothing while restoring session from sessionStorage
  if (loading) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '100vh', background: 'var(--bg-base)',
      }}>
        <div className="spinner" style={{ width: 28, height: 28, borderWidth: 3, color: 'var(--accent-primary)' }} />
      </div>
    );
  }

  // Not logged in → login page
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Role check — roles=[] means any authenticated user is fine
  if (roles.length > 0 && !roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}

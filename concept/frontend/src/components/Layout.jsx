/**
 * components/Layout.jsx
 *
 * App shell: fixed sidebar + top bar + content area.
 * Sidebar nav items filtered by user role (access-control.md).
 * Active item = filled amber pill (design.md §4 "standardize on filled").
 * Top bar: search, user name, role badge (--status-blue), avatar initials.
 */

import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import StatusBadge from './StatusBadge';

// All nav items — visibility controlled by role
const NAV_ITEMS = [
  { to: '/',               label: 'Dashboard',     icon: '⊞', roles: ['fleet_manager', 'driver', 'safety_officer', 'financial_analyst'] },
  { to: '/vehicles',       label: 'Fleet',         icon: '🚛', roles: ['fleet_manager', 'driver', 'safety_officer', 'financial_analyst'] },
  { to: '/drivers',        label: 'Drivers',       icon: '👤', roles: ['fleet_manager', 'driver', 'safety_officer', 'financial_analyst'] },
  { to: '/trips',          label: 'Trips',         icon: '🗺',  roles: ['fleet_manager', 'driver'] },
  { to: '/maintenance',    label: 'Maintenance',   icon: '🔧', roles: ['fleet_manager'] },
  { to: '/fuel-expenses',  label: 'Fuel & Expenses', icon: '⛽', roles: ['fleet_manager', 'driver', 'financial_analyst'] },
  { to: '/reports',        label: 'Analytics',     icon: '📊', roles: ['fleet_manager', 'safety_officer', 'financial_analyst'] },
  { to: '/settings',       label: 'Settings',      icon: '⚙',  roles: ['fleet_manager'] },
];

function initials(name = '') {
  return name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase();
}

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const visibleNav = NAV_ITEMS.filter(item =>
    !user || item.roles.includes(user.role)
  );

  return (
    <div className="app-shell">
      {/* ── Sidebar ── */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="sidebar-logo-wordmark">TransitOps</div>
          <div className="sidebar-logo-sub">Smart Transport Ops</div>
        </div>

        <nav className="sidebar-nav">
          {visibleNav.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <span className="nav-icon">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Logout at bottom of sidebar */}
        <div style={{ padding: '12px 10px', borderTop: '1px solid var(--border-subtle)' }}>
          <button
            className="nav-item"
            onClick={logout}
            style={{ color: 'var(--text-muted)' }}
          >
            <span className="nav-icon">⎋</span>
            Sign Out
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="main-wrapper">
        {/* Top Bar */}
        <header className="topbar">
          <div className="topbar-search">
            <input placeholder="Search anything…" id="topbar-search-input" />
          </div>

          <div className="topbar-right">
            {user && (
              <>
                <span className="topbar-username">{user.name}</span>
                <StatusBadge value={user.role} />
                <div className="avatar" title={user.name}>
                  {initials(user.name)}
                </div>
              </>
            )}
          </div>
        </header>

        {/* Page content */}
        <main className="content-area fade-in">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

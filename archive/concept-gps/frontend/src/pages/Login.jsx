/**
 * pages/Login.jsx — Authentication screen
 *
 * Design: split screen — left panel (light/neutral, logo + tagline + role descriptions),
 * right panel (dark, login form). Error state via RuleCallout. (design.md §6 screen 0)
 *
 * Auth flow: authentication-signin.md §3 POST /auth/login
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import RuleCallout from '../components/RuleCallout';

const ROLES = [
  {
    value: 'fleet_manager',
    label: 'Fleet Manager',
    bg: '#4A90D9',
    desc: 'Full access — vehicles, drivers, trips, maintenance, fuel, analytics, settings.',
  },
  {
    value: 'driver',
    label: 'Driver',
    bg: '#4A90D9',
    desc: 'View fleet & drivers; create and manage own trips; log fuel.',
  },
  {
    value: 'safety_officer',
    label: 'Safety Officer',
    bg: '#4A90D9',
    desc: 'View fleet & drivers; update driver safety status; view analytics.',
  },
  {
    value: 'financial_analyst',
    label: 'Financial Analyst',
    bg: '#4A90D9',
    desc: 'View vehicles, drivers, trips; full access to fuel & expenses; analytics.',
  },
];

export default function Login() {
  const { login }     = useAuth();
  const navigate      = useNavigate();

  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [role,     setRole]     = useState('');
  const [remember, setRemember] = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setErrorMsg('');

    // Client-side validation
    if (!email.trim() || !password) {
      setErrorMsg('Please enter your email and password.');
      return;
    }
    if (password.length < 8) {
      setErrorMsg('Password must be at least 8 characters.');
      return;
    }

    setLoading(true);
    try {
      await login(email.trim(), password);
      navigate('/', { replace: true });
    } catch (err) {
      // Generic message — never reveal whether email exists (security.md)
      setErrorMsg('Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-shell">
      {/* ── Left panel (light) ── */}
      <div className="login-left">
        <div>
          <div className="login-logo">TransitOps</div>
          <div className="login-logo-sub">Smart Transport Operations Platform</div>
        </div>

        <div className="login-tagline">
          Move fleets.<br />Stay in control.
        </div>
        <div className="login-tagline-sub">
          Real-time dispatch, driver safety, fuel tracking, and analytics — 
          all in one place for modern transport teams.
        </div>

        <div className="login-role-list">
          <div className="label-caps" style={{ color: '#7A7A7A', marginBottom: 6 }}>
            Who uses TransitOps
          </div>
          {ROLES.map(r => (
            <div key={r.value} className="login-role-item">
              <span
                className="login-role-badge"
                style={{ background: r.bg + '22', color: r.bg }}
              >
                {r.label}
              </span>
              <span>{r.desc}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right panel (dark) ── */}
      <div className="login-right">
        <div className="login-form-card fade-in">
          <div className="login-form-title">Sign in</div>
          <div className="login-form-sub">Enter your credentials to access your workspace.</div>

          {errorMsg && (
            <div style={{ marginBottom: 20 }}>
              <RuleCallout violation>{errorMsg}</RuleCallout>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div className="form-group">
              <label className="form-label" htmlFor="login-email">Email</label>
              <input
                id="login-email"
                type="email"
                className="form-input"
                placeholder="you@transitops.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="login-password">Password</label>
              <input
                id="login-password"
                type="password"
                className="form-input"
                placeholder="Min. 8 characters"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="login-role">Role</label>
              <select
                id="login-role"
                className="form-select"
                value={role}
                onChange={e => setRole(e.target.value)}
              >
                <option value="">Select your role</option>
                {ROLES.map(r => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-between" style={{ marginBottom: 24 }}>
              <label className="form-checkbox">
                <input
                  type="checkbox"
                  id="login-remember"
                  checked={remember}
                  onChange={e => setRemember(e.target.checked)}
                />
                Remember me
              </label>
              <span className="login-forgot">Forgot password?</span>
            </div>

            <button
              id="login-submit"
              type="submit"
              className="btn btn-primary w-full"
              disabled={loading}
              style={{ justifyContent: 'center', padding: '11px' }}
            >
              {loading ? <span className="spinner" /> : null}
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          <div className="login-form-footer">
            Access is granted by your Fleet Manager.<br />
            Contact your admin if you cannot sign in.
          </div>
        </div>
      </div>
    </div>
  );
}

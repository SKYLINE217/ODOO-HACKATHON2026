/**
 * pages/Signup.jsx — Registration screen
 *
 * Design: split screen similar to Login — left panel (light/neutral, logo + tagline + role descriptions),
 * right panel (dark, signup form). Error state via RuleCallout.
 */

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import RuleCallout from '../components/RuleCallout';
import { authApi } from '../api/client';

const ROLES = [
  { value: 'fleet_manager', label: 'Fleet Manager', bg: '#4A90D9', desc: 'Full access — vehicles, drivers, trips, maintenance, fuel, analytics, settings.' },
  { value: 'driver', label: 'Driver', bg: '#4A90D9', desc: 'View fleet & drivers; create and manage own trips; log fuel.' },
  { value: 'safety_officer', label: 'Safety Officer', bg: '#4A90D9', desc: 'View fleet & drivers; update driver safety status; view analytics.' },
  { value: 'financial_analyst', label: 'Financial Analyst', bg: '#4A90D9', desc: 'View vehicles, drivers, trips; full access to fuel & expenses; analytics.' },
];

export default function Signup() {
  const { login }     = useAuth();
  const navigate      = useNavigate();

  const [name,     setName]     = useState('');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [role,     setRole]     = useState('');
  const [loading,  setLoading]  = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setErrorMsg('');

    // Client-side validation
    if (!name.trim() || !email.trim() || !password || !role) {
      setErrorMsg('All fields are required.');
      return;
    }
    if (password.length < 8) {
      setErrorMsg('Password must be at least 8 characters.');
      return;
    }

    setLoading(true);
    try {
      // 1. Create the user
      await authApi.signup(name.trim(), email.trim(), password, role);
      // 2. Log them in automatically
      await login(email.trim(), password);
      // 3. Redirect to dashboard
      navigate('/', { replace: true });
    } catch (err) {
      setErrorMsg(err.message || 'Signup failed. Please try again.');
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
          Join the team.<br />Start moving.
        </div>
        <div className="login-tagline-sub">
          Sign up to get access to real-time dispatch, driver safety, fuel tracking, and analytics.
        </div>

        <div className="login-role-list">
          <div className="label-caps" style={{ color: '#7A7A7A', marginBottom: 6 }}>
            Roles & Permissions
          </div>
          {ROLES.map(r => (
            <div key={r.value} className="login-role-item">
              <span className="login-role-badge" style={{ background: r.bg + '22', color: r.bg }}>
                {r.label}
              </span>
              <span>{r.desc}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right panel (dark) ── */}
      <div className="login-right">
        <div className="login-form-card fade-in" style={{ padding: '32px' }}>
          <div className="login-form-title">Create an Account</div>
          <div className="login-form-sub">Sign up to access the workspace.</div>

          {errorMsg && (
            <div style={{ marginBottom: 20 }}>
              <RuleCallout violation>{errorMsg}</RuleCallout>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div className="form-group">
              <label className="form-label" htmlFor="signup-name">Full Name</label>
              <input id="signup-name" type="text" className="form-input" placeholder="Alex Doe"
                value={name} onChange={e => setName(e.target.value)} required />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="signup-email">Email</label>
              <input id="signup-email" type="email" className="form-input" placeholder="alex@transitops.com"
                value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" required />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="signup-password">Password</label>
              <input id="signup-password" type="password" className="form-input" placeholder="Min. 8 characters"
                value={password} onChange={e => setPassword(e.target.value)} autoComplete="new-password" required />
            </div>

            <div className="form-group" style={{ marginBottom: 24 }}>
              <label className="form-label" htmlFor="signup-role">Role</label>
              <select id="signup-role" className="form-select" value={role} onChange={e => setRole(e.target.value)}>
                <option value="">Select your role</option>
                {ROLES.map(r => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>

            <button type="submit" className="btn btn-primary w-full" disabled={loading} style={{ justifyContent: 'center', padding: '11px' }}>
              {loading ? <span className="spinner" /> : null}
              {loading ? 'Signing up…' : 'Sign Up'}
            </button>
          </form>

          <div className="login-form-footer" style={{ marginTop: 24 }}>
            Already have an account? <Link to="/login" style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>Sign In</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

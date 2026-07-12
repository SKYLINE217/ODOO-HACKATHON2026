/**
 * pages/Settings.jsx — Screen 8 (Settings & RBAC)
 *
 * Left: General settings form (Depot Name, Currency, Distance Unit) + Save.
 * Right: RBAC matrix table (4 roles × 5 modules) — design.md §5 & §6 screen 8.
 * Columns: Fleet / Drivers / Trips / Fuel & Exp. / Analytics
 */

import { useState, useEffect } from 'react';
import RuleCallout from '../components/RuleCallout';
import { mockSettings } from '../api/mock';
// TODO: swap mock: import { settingsApi } from '../api/client';

const RBAC = [
  {
    role: 'Fleet Manager',
    fleet: 'full', drivers: 'full', trips: 'full', fuel: 'full', analytics: 'full',
  },
  {
    role: 'Driver',
    fleet: 'view', drivers: 'view', trips: 'full', fuel: 'full', analytics: '—',
  },
  {
    role: 'Safety Officer',
    fleet: 'view', drivers: 'full', trips: 'view', fuel: '—', analytics: 'view',
  },
  {
    role: 'Financial Analyst',
    fleet: 'view', drivers: 'view', trips: 'view', fuel: 'full', analytics: 'full',
  },
];

function RbacCell({ value }) {
  if (value === 'full') return <span className="rbac-full">✓</span>;
  if (value === 'view') return <span className="rbac-view">View</span>;
  return <span className="rbac-none">—</span>;
}

export default function Settings() {
  const [form, setForm]   = useState({ depot_name: '', currency: 'USD', distance_unit: 'km' });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved]   = useState(false);

  useEffect(() => {
    // Replace with: settingsApi.get().then(s => setForm(s))
    setForm(mockSettings);
  }, []);

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    try {
      // TODO: await settingsApi.update(form);
      await new Promise(r => setTimeout(r, 500));
      setSaved(true);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1 className="page-title">Settings &amp; RBAC</h1>
        <p className="page-subtitle">General configuration and role-based access overview</p>
      </div>

      <div className="two-col">
        {/* ── Left: General Settings ── */}
        <div className="card">
          <div className="label-caps" style={{ marginBottom: 16 }}>General</div>
          <form onSubmit={handleSave}>
            <div className="form-group">
              <label className="form-label" htmlFor="settings-depot-name">Depot Name</label>
              <input id="settings-depot-name" className="form-input"
                value={form.depot_name}
                onChange={e => setForm(f => ({ ...f, depot_name: e.target.value }))} />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="settings-currency">Currency</label>
                <select id="settings-currency" className="form-select"
                  value={form.currency}
                  onChange={e => setForm(f => ({ ...f, currency: e.target.value }))}>
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="INR">INR (₹)</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="settings-distance">Distance Unit</label>
                <select id="settings-distance" className="form-select"
                  value={form.distance_unit}
                  onChange={e => setForm(f => ({ ...f, distance_unit: e.target.value }))}>
                  <option value="km">Kilometres (km)</option>
                  <option value="mi">Miles (mi)</option>
                </select>
              </div>
            </div>

            {saved && (
              <div style={{ marginBottom: 14, padding: '10px 14px', background: 'rgba(76,175,80,0.1)', border: '1px solid var(--status-green)', borderRadius: 8, color: 'var(--status-green)', fontSize: 12 }}>
                ✓ Settings saved successfully.
              </div>
            )}

            <button id="settings-save-btn" type="submit" className="btn btn-primary" disabled={saving}
              style={{ width: '100%', justifyContent: 'center', padding: 11 }}>
              {saving ? <span className="spinner" /> : 'Save Changes'}
            </button>
          </form>

          <div className="divider" />

          <RuleCallout info>
            Settings are global and apply to all users. Only Fleet Managers can access this page.
          </RuleCallout>
        </div>

        {/* ── Right: RBAC Matrix ── */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border-subtle)' }}>
            <span className="font-semibold">Role-Based Access Control</span>
            <div className="text-sm" style={{ color: 'var(--text-secondary)', marginTop: 3 }}>
              Summary view — enforcement is done server-side
            </div>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="rbac-matrix">
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: '10px 16px' }}>Role</th>
                  <th>Fleet</th>
                  <th>Drivers</th>
                  <th>Trips</th>
                  <th>Fuel &amp; Exp.</th>
                  <th>Analytics</th>
                </tr>
              </thead>
              <tbody>
                {RBAC.map(row => (
                  <tr key={row.role}>
                    <td style={{ fontWeight: 600, fontSize: 13, padding: '10px 16px' }}>{row.role}</td>
                    <td><RbacCell value={row.fleet} /></td>
                    <td><RbacCell value={row.drivers} /></td>
                    <td><RbacCell value={row.trips} /></td>
                    <td><RbacCell value={row.fuel} /></td>
                    <td><RbacCell value={row.analytics} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border-subtle)', fontSize: 11, color: 'var(--text-muted)' }}>
            <span className="rbac-full">✓</span> Full access &nbsp;·&nbsp; <span className="rbac-view">View</span> Read-only &nbsp;·&nbsp; <span className="rbac-none">—</span> No access
          </div>
        </div>
      </div>
    </div>
  );
}

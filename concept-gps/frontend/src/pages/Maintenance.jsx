/**
 * pages/Maintenance.jsx — Screen 5
 *
 * Left: Log Service Record form.
 * Right: Service Log table + status-transition diagram (Available ↔ In Shop) + RuleCallout.
 * (design.md §6 screen 5)
 */

import { useState, useEffect } from 'react';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import RuleCallout from '../components/RuleCallout';
import { mockMaintenance, mockVehicles } from '../api/mock';
// TODO: swap mock: import { maintenanceApi, vehiclesApi } from '../api/client';

const LOG_COLUMNS = [
  { key: 'vehicle_reg',   label: 'Vehicle' },
  { key: 'service_type',  label: 'Service Type' },
  { key: 'cost',          label: 'Cost', render: v => `$${v.toLocaleString()}` },
  { key: 'date',          label: 'Date' },
  { key: 'status',        label: 'Status', badge: true },
];

const SERVICE_TYPES = [
  'Oil Change', 'Tyre Replacement', 'Engine Overhaul', 'Brake Service',
  'Transmission Service', 'Battery Replacement', 'Air Filter', 'Other',
];

export default function Maintenance() {
  const [logs, setLogs]       = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [form, setForm]       = useState({
    vehicle_id: '', service_type: '', cost: '', date: '', status: 'scheduled',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Replace with real APIs
    setLogs(mockMaintenance);
    setVehicles(mockVehicles);
  }, []);

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    try {
      // TODO: const record = await maintenanceApi.create(form);
      const vehicle = vehicles.find(v => v.id === Number(form.vehicle_id));
      const record = {
        id: Date.now(),
        vehicle_reg: vehicle?.registration_no ?? '—',
        ...form,
        cost: Number(form.cost),
      };
      setLogs(prev => [record, ...prev]);
      setForm({ vehicle_id: '', service_type: '', cost: '', date: '', status: 'scheduled' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1 className="page-title">Maintenance</h1>
        <p className="page-subtitle">Log service records and track vehicle repair status</p>
      </div>

      <div className="two-col">
        {/* ── Left: Log Form ── */}
        <div className="card">
          <div className="label-caps" style={{ marginBottom: 16 }}>Log Service Record</div>
          <form onSubmit={handleSave}>
            <div className="form-group">
              <label className="form-label" htmlFor="maint-vehicle">Vehicle</label>
              <select id="maint-vehicle" className="form-select" required
                value={form.vehicle_id}
                onChange={e => setForm(f => ({ ...f, vehicle_id: e.target.value }))}>
                <option value="">Select vehicle…</option>
                {vehicles.map(v => (
                  <option key={v.id} value={v.id}>{v.registration_no} — {v.model}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="maint-service-type">Service Type</label>
              <select id="maint-service-type" className="form-select" required
                value={form.service_type}
                onChange={e => setForm(f => ({ ...f, service_type: e.target.value }))}>
                <option value="">Select service type…</option>
                {SERVICE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="maint-cost">Cost ($)</label>
                <input id="maint-cost" className="form-input" type="number" min="0" placeholder="0.00"
                  value={form.cost}
                  onChange={e => setForm(f => ({ ...f, cost: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="maint-date">Date</label>
                <input id="maint-date" className="form-input" type="date" required
                  value={form.date}
                  onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="maint-status">Status</label>
              <select id="maint-status" className="form-select"
                value={form.status}
                onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                <option value="scheduled">Scheduled</option>
                <option value="in_progress">In Progress</option>
                <option value="done">Done</option>
              </select>
            </div>

            <button id="maint-save-btn" type="submit" className="btn btn-primary" disabled={saving}
              style={{ width: '100%', justifyContent: 'center', padding: 11 }}>
              {saving ? <span className="spinner" /> : '💾 Save Record'}
            </button>
          </form>
        </div>

        {/* ── Right: Log Table + Diagram + Rule ── */}
        <div>
          <div className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: 16 }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border-subtle)' }}>
              <span className="font-semibold">Service Log</span>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <DataTable columns={LOG_COLUMNS} rows={logs} emptyMessage="No service records yet." />
            </div>
          </div>

          {/* Status-transition diagram */}
          <div className="status-diagram">
            <StatusBadge value="available" />
            <span className="status-diagram-arrow">⇄</span>
            <StatusBadge value="in_shop" />
            <div style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.5 }}>
              Logging a vehicle as <strong>In Progress</strong> moves it to <em>In Shop</em>.<br />
              Marking as <strong>Done</strong> returns it to <em>Available</em>.
            </div>
          </div>

          <div style={{ marginTop: 12 }}>
            <RuleCallout>
              Vehicles marked "In Shop" are automatically removed from the Trip Dispatcher pool — they cannot be assigned to new trips until returned to Available.
            </RuleCallout>
          </div>
        </div>
      </div>
    </div>
  );
}

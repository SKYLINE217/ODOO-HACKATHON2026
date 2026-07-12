/**
 * pages/Drivers.jsx — Screen 3 (Drivers & Safety Profiles)
 *
 * Search + Add Driver + DataTable with two status columns (SAFETY ≠ STATUS) +
 * tooltip explaining difference + Quick toggle pill bar + RuleCallout footer.
 * (design.md §6 screen 3)
 */

import { useState, useEffect } from 'react';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import RuleCallout from '../components/RuleCallout';
import { useAuth } from '../context/AuthContext';
import { mockDrivers } from '../api/mock';
// TODO: swap mock: import { driversApi } from '../api/client';

const DRIVER_STATUSES = ['available', 'on_trip', 'off_duty', 'suspended'];

const COLUMNS = [
  { key: 'name',           label: 'Name' },
  { key: 'license_no',     label: 'License No.' },
  { key: 'license_expiry', label: 'Expiry Date' },
  { key: 'phone',          label: 'Phone' },
  {
    key: 'safety_status',
    label: 'Safety',
    render: (val) => (
      <div className="tooltip-wrap">
        <StatusBadge value={val === 'expired' ? 'expired' : 'available'} />
        <div className="tooltip-box">
          License compliance state — derived from license expiry date.
        </div>
      </div>
    ),
  },
  {
    key: 'status',
    label: 'Status',
    render: (val) => (
      <div className="tooltip-wrap">
        <StatusBadge value={val} />
        <div className="tooltip-box">
          Operational state — manually set (available / on_trip / off_duty / suspended).
        </div>
      </div>
    ),
  },
];

export default function Drivers() {
  const { user } = useAuth();
  const canAdd   = ['fleet_manager', 'safety_officer'].includes(user?.role);

  const [drivers, setDrivers]         = useState([]);
  const [selectedId, setSelectedId]   = useState(null);
  const [showModal, setShowModal]     = useState(false);

  useEffect(() => {
    // Replace with: driversApi.list().then(setDrivers)
    setDrivers(mockDrivers);
  }, []);

  function handleToggle(newStatus) {
    if (!selectedId) return;
    setDrivers(prev =>
      prev.map(d => d.id === selectedId ? { ...d, status: newStatus } : d)
    );
    // TODO: driversApi.update(selectedId, { status: newStatus })
  }

  return (
    <div className="fade-in">
      <div className="page-header flex items-center justify-between">
        <div>
          <h1 className="page-title">Drivers</h1>
          <p className="page-subtitle">Safety profiles and operational status</p>
        </div>
        {canAdd && (
          <button id="add-driver-btn" className="btn btn-primary" onClick={() => setShowModal(true)}>
            + Add Driver
          </button>
        )}
      </div>

      <DataTable
        columns={COLUMNS}
        rows={drivers}
        searchKeys={['name', 'license_no']}
        emptyMessage="No drivers found."
        actions={row => (
          <button
            className={`btn btn-ghost btn-sm ${selectedId === row.id ? 'btn-primary' : ''}`}
            id={`select-driver-${row.id}`}
            onClick={() => setSelectedId(id => id === row.id ? null : row.id)}
            style={selectedId === row.id ? { background: 'var(--accent-primary)', color: 'var(--accent-text)' } : {}}
          >
            {selectedId === row.id ? 'Selected' : 'Select'}
          </button>
        )}
      />

      {/* Quick status toggle */}
      <div className="card" style={{ marginTop: 16 }}>
        <div className="label-caps" style={{ marginBottom: 8 }}>
          Quick Status Toggle
          {!selectedId && <span style={{ color: 'var(--text-muted)', fontWeight: 400, marginLeft: 8, fontSize: 11 }}>— select a driver row first</span>}
        </div>
        <div className="quick-toggle">
          {DRIVER_STATUSES.map(s => (
            <button
              key={s}
              id={`toggle-status-${s}`}
              className={`toggle-pill ${!selectedId ? 'opacity-50' : ''}`}
              disabled={!selectedId}
              onClick={() => handleToggle(s)}
            >
              {s.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}
            </button>
          ))}
        </div>
      </div>

      {/* Rule Callout footer */}
      <div style={{ marginTop: 16 }}>
        <RuleCallout>
          Drivers with an expired license or Suspended status are automatically blocked from trip assignment and removed from the dispatch pool. Safety = license compliance state; Status = operational state — they can diverge (e.g. valid license + Off Duty).
        </RuleCallout>
      </div>

      {showModal && (
        <DriverModal onClose={() => setShowModal(false)} onSave={d => {
          setDrivers(prev => [...prev, { ...d, id: Date.now(), safety_status: 'available' }]);
          setShowModal(false);
        }} />
      )}
    </div>
  );
}

function DriverModal({ onClose, onSave }) {
  const [form, setForm] = useState({
    name: '', license_no: '', license_expiry: '', phone: '', status: 'available',
  });

  function handleSubmit(e) {
    e.preventDefault();
    onSave(form);
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200,
    }}>
      <div className="card" style={{ width: 460, maxWidth: '90vw' }}>
        <div className="flex items-center justify-between" style={{ marginBottom: 24 }}>
          <span className="font-semibold text-lg">Add Driver</span>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input id="dr-name-input" className="form-input" required
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">License No.</label>
              <input id="dr-lic-input" className="form-input" required
                value={form.license_no}
                onChange={e => setForm(f => ({ ...f, license_no: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">License Expiry</label>
              <input id="dr-expiry-input" className="form-input" type="date" required
                value={form.license_expiry}
                onChange={e => setForm(f => ({ ...f, license_expiry: e.target.value }))} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Phone</label>
            <input id="dr-phone-input" className="form-input"
              value={form.phone}
              onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
          </div>
          <div className="flex gap-2" style={{ marginTop: 8 }}>
            <button type="submit" id="dr-save-btn" className="btn btn-primary">Save Driver</button>
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

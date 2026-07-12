/**
 * pages/Vehicles.jsx — Screen 2 (Vehicle Registry / Fleet)
 *
 * Filter bar + search + "Add Vehicle" (fleet_manager only) + DataTable + RuleCallout footer.
 * (design.md §6 screen 2)
 */

import { useState, useEffect } from 'react';
import DataTable from '../components/DataTable';
import RuleCallout from '../components/RuleCallout';
import StatusBadge from '../components/StatusBadge';
import { useAuth } from '../context/AuthContext';
import { mockVehicles } from '../api/mock';
// TODO: swap mock: import { vehiclesApi } from '../api/client';

const COLUMNS = [
  { key: 'registration_no', label: 'Reg. No.' },
  { key: 'type',            label: 'Type',   render: v => <span className="capitalize">{v}</span> },
  { key: 'model',           label: 'Model' },
  { key: 'region',          label: 'Region', render: v => <span className="capitalize">{v}</span> },
  { key: 'max_load_capacity_kg', label: 'Max Load (kg)', render: v => v ? v.toLocaleString() : '—' },
  { key: 'status',          label: 'Status', badge: true },
];

export default function Vehicles() {
  const { user }    = useAuth();
  const isManager   = user?.role === 'fleet_manager';

  const [vehicles, setVehicles] = useState([]);
  const [filters, setFilters]   = useState({ type: '', status: '' });
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    // Replace with: vehiclesApi.list(filters).then(setVehicles)
    let rows = mockVehicles;
    if (filters.type)   rows = rows.filter(v => v.type === filters.type);
    if (filters.status) rows = rows.filter(v => v.status === filters.status);
    setVehicles(rows);
  }, [filters]);

  return (
    <div className="fade-in">
      <div className="page-header flex items-center justify-between">
        <div>
          <h1 className="page-title">Fleet</h1>
          <p className="page-subtitle">Vehicle registry and status overview</p>
        </div>
        {isManager && (
          <button id="add-vehicle-btn" className="btn btn-primary" onClick={() => setShowModal(true)}>
            + Add Vehicle
          </button>
        )}
      </div>

      {/* Filter Bar */}
      <div className="filter-bar">
        <select
          id="vehicles-filter-type"
          className="filter-select"
          value={filters.type}
          onChange={e => setFilters(f => ({ ...f, type: e.target.value }))}
        >
          <option value="">All Types</option>
          <option value="truck">Truck</option>
          <option value="van">Van</option>
          <option value="bus">Bus</option>
        </select>

        <select
          id="vehicles-filter-status"
          className="filter-select"
          value={filters.status}
          onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}
        >
          <option value="">All Statuses</option>
          <option value="available">Available</option>
          <option value="on_trip">On Trip</option>
          <option value="in_shop">In Shop</option>
          <option value="retired">Retired</option>
        </select>
      </div>

      <DataTable
        columns={COLUMNS}
        rows={vehicles}
        searchKeys={['registration_no', 'model', 'region']}
        emptyMessage="No vehicles found matching your filters."
        actions={isManager ? row => (
          <div className="flex gap-2">
            <button className="btn btn-ghost btn-sm" id={`edit-vehicle-${row.id}`}>Edit</button>
          </div>
        ) : undefined}
      />

      {/* Rule Callout footer — static business rule */}
      <div style={{ marginTop: 16 }}>
        <RuleCallout>
          Registration No. must be unique across the fleet. · Retired and In Shop vehicles are automatically hidden from the Trip Dispatcher's vehicle dropdown.
        </RuleCallout>
      </div>

      {/* Add Vehicle Modal */}
      {showModal && (
        <VehicleModal onClose={() => setShowModal(false)} onSave={v => {
          setVehicles(prev => [...prev, { ...v, id: Date.now() }]);
          setShowModal(false);
        }} />
      )}
    </div>
  );
}

function VehicleModal({ onClose, onSave }) {
  const [form, setForm] = useState({
    registration_no: '', type: 'truck', model: '', region: '', max_load_capacity_kg: '', status: 'available',
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
      <div className="card" style={{ width: 480, maxWidth: '90vw' }}>
        <div className="flex items-center justify-between" style={{ marginBottom: 24 }}>
          <span className="font-semibold text-lg">Add Vehicle</span>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Registration No.</label>
              <input id="vh-reg-input" className="form-input" required
                value={form.registration_no}
                onChange={e => setForm(f => ({ ...f, registration_no: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Type</label>
              <select id="vh-type-select" className="form-select"
                value={form.type}
                onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                <option value="truck">Truck</option>
                <option value="van">Van</option>
                <option value="bus">Bus</option>
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Model</label>
            <input id="vh-model-input" className="form-input" required
              value={form.model}
              onChange={e => setForm(f => ({ ...f, model: e.target.value }))} />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Region</label>
              <input id="vh-region-input" className="form-input"
                value={form.region}
                onChange={e => setForm(f => ({ ...f, region: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Max Load (kg)</label>
              <input id="vh-load-input" className="form-input" type="number" min="0"
                value={form.max_load_capacity_kg}
                onChange={e => setForm(f => ({ ...f, max_load_capacity_kg: e.target.value }))} />
            </div>
          </div>
          <div className="flex gap-2" style={{ marginTop: 8 }}>
            <button type="submit" id="vh-save-btn" className="btn btn-primary">Save Vehicle</button>
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

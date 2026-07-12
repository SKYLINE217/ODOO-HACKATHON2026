/**
 * pages/FuelExpenses.jsx — Screen 6 (Fuel & Expense Management)
 *
 * Fuel Logs table + "Log Fuel" / "Add Expense" buttons.
 * Other Expenses table below.
 * Total Operational Cost line in --accent-primary (Fuel + Maintenance formula).
 * (design.md §6 screen 6)
 */

import { useState, useEffect } from 'react';
import DataTable from '../components/DataTable';
import { mockFuelLogs, mockExpenses, mockTotalCost, mockVehicles } from '../api/mock';
// TODO: swap mock: import { fuelApi, vehiclesApi } from '../api/client';

const FUEL_COLS = [
  { key: 'vehicle_reg',      label: 'Vehicle' },
  { key: 'litres',           label: 'Litres' },
  { key: 'cost_per_litre',   label: '$/Litre', render: v => `$${v.toFixed(2)}` },
  { key: 'total_cost',       label: 'Total', render: v => `$${v.toLocaleString()}` },
  { key: 'odometer_km',      label: 'Odometer (km)', render: v => v.toLocaleString() },
  { key: 'date',             label: 'Date' },
];

const EXPENSE_COLS = [
  { key: 'type',        label: 'Type', render: v => <span className="capitalize">{v}</span> },
  { key: 'description', label: 'Description' },
  { key: 'amount',      label: 'Amount', render: v => `$${v.toLocaleString()}` },
  { key: 'trip_id',     label: 'Trip ID' },
  { key: 'date',        label: 'Date' },
];

export default function FuelExpenses() {
  const [fuelLogs, setFuelLogs]   = useState([]);
  const [expenses, setExpenses]   = useState([]);
  const [totalCost, setTotalCost] = useState(null);
  const [vehicles, setVehicles]   = useState([]);

  const [showFuelModal, setShowFuelModal]       = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);

  useEffect(() => {
    setFuelLogs(mockFuelLogs);
    setExpenses(mockExpenses);
    setTotalCost(mockTotalCost);
    setVehicles(mockVehicles);
  }, []);

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1 className="page-title">Fuel &amp; Expenses</h1>
        <p className="page-subtitle">Track fuel consumption and operational expenditure</p>
      </div>

      {/* Fuel Logs */}
      <div className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: 20 }}>
        <div className="flex items-center justify-between" style={{ padding: '14px 18px', borderBottom: '1px solid var(--border-subtle)' }}>
          <span className="font-semibold">Fuel Logs</span>
          <button id="log-fuel-btn" className="btn btn-primary btn-sm" onClick={() => setShowFuelModal(true)}>
            + Log Fuel
          </button>
        </div>
        <DataTable columns={FUEL_COLS} rows={fuelLogs} searchKeys={['vehicle_reg']} emptyMessage="No fuel records yet." />
      </div>

      {/* Other Expenses */}
      <div className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: 20 }}>
        <div className="flex items-center justify-between" style={{ padding: '14px 18px', borderBottom: '1px solid var(--border-subtle)' }}>
          <span className="font-semibold">Other Expenses</span>
          <button id="add-expense-btn" className="btn btn-ghost btn-sm" onClick={() => setShowExpenseModal(true)}>
            + Add Expense
          </button>
        </div>
        <DataTable columns={EXPENSE_COLS} rows={expenses} emptyMessage="No expenses logged." />
      </div>

      {/* Total Operational Cost */}
      {totalCost && (
        <div className="total-cost-line">
          <div>
            <div className="total-cost-label">Total Operational Cost</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
              Fuel ${totalCost.fuel_total.toLocaleString()} + Maintenance ${totalCost.maintenance_total.toLocaleString()} + Expenses ${totalCost.expense_total.toLocaleString()}
            </div>
          </div>
          <div className="total-cost-value">${totalCost.grand_total.toLocaleString()}</div>
        </div>
      )}

      {/* Modals */}
      {showFuelModal && (
        <FuelModal
          vehicles={vehicles}
          onClose={() => setShowFuelModal(false)}
          onSave={log => {
            setFuelLogs(prev => [log, ...prev]);
            setShowFuelModal(false);
          }}
        />
      )}

      {showExpenseModal && (
        <ExpenseModal
          onClose={() => setShowExpenseModal(false)}
          onSave={exp => {
            setExpenses(prev => [exp, ...prev]);
            setShowExpenseModal(false);
          }}
        />
      )}
    </div>
  );
}

function FuelModal({ vehicles, onClose, onSave }) {
  const [form, setForm] = useState({ vehicle_id: '', litres: '', cost_per_litre: '', odometer_km: '', date: '' });

  function handleSubmit(e) {
    e.preventDefault();
    const vehicle = vehicles.find(v => v.id === Number(form.vehicle_id));
    onSave({
      id: Date.now(),
      vehicle_reg: vehicle?.registration_no ?? '—',
      litres: Number(form.litres),
      cost_per_litre: Number(form.cost_per_litre),
      total_cost: Math.round(Number(form.litres) * Number(form.cost_per_litre) * 100) / 100,
      odometer_km: Number(form.odometer_km),
      date: form.date,
    });
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}>
      <div className="card" style={{ width: 440, maxWidth: '90vw' }}>
        <div className="flex items-center justify-between" style={{ marginBottom: 20 }}>
          <span className="font-semibold text-lg">Log Fuel</span>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Vehicle</label>
            <select id="fuel-vehicle-select" className="form-select" required value={form.vehicle_id}
              onChange={e => setForm(f => ({ ...f, vehicle_id: e.target.value }))}>
              <option value="">Select vehicle…</option>
              {vehicles.map(v => <option key={v.id} value={v.id}>{v.registration_no}</option>)}
            </select>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Litres</label>
              <input id="fuel-litres-input" className="form-input" type="number" min="0" step="0.1" required value={form.litres} onChange={e => setForm(f => ({ ...f, litres: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Cost / Litre ($)</label>
              <input id="fuel-cost-input" className="form-input" type="number" min="0" step="0.01" required value={form.cost_per_litre} onChange={e => setForm(f => ({ ...f, cost_per_litre: e.target.value }))} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Odometer (km)</label>
              <input id="fuel-odometer-input" className="form-input" type="number" min="0" value={form.odometer_km} onChange={e => setForm(f => ({ ...f, odometer_km: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Date</label>
              <input id="fuel-date-input" className="form-input" type="date" required value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
            </div>
          </div>
          {form.litres && form.cost_per_litre && (
            <div style={{ marginBottom: 16, fontSize: 13, color: 'var(--accent-primary)', fontWeight: 600 }}>
              Total: ${(Number(form.litres) * Number(form.cost_per_litre)).toFixed(2)}
            </div>
          )}
          <div className="flex gap-2">
            <button id="fuel-save-btn" type="submit" className="btn btn-primary">Save</button>
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ExpenseModal({ onClose, onSave }) {
  const [form, setForm] = useState({ type: 'toll', description: '', amount: '', trip_id: '', date: '' });

  function handleSubmit(e) {
    e.preventDefault();
    onSave({ id: Date.now(), ...form, amount: Number(form.amount) });
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}>
      <div className="card" style={{ width: 400, maxWidth: '90vw' }}>
        <div className="flex items-center justify-between" style={{ marginBottom: 20 }}>
          <span className="font-semibold text-lg">Add Expense</span>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Type</label>
            <select id="exp-type-select" className="form-select" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
              <option value="toll">Toll</option>
              <option value="misc">Miscellaneous</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <input id="exp-desc-input" className="form-input" required value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Amount ($)</label>
              <input id="exp-amount-input" className="form-input" type="number" min="0" step="0.01" required value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Date</label>
              <input id="exp-date-input" className="form-input" type="date" required value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
            </div>
          </div>
          <div className="flex gap-2">
            <button id="exp-save-btn" type="submit" className="btn btn-primary">Save</button>
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

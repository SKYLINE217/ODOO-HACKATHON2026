/**
 * pages/Trips.jsx — Screen 4 (Trip Dispatcher)
 *
 * Two-column layout:
 * Left: Trip lifecycle stepper + create-trip form with dispatch-pool-only dropdowns
 *       + live cargo-weight validation + Dispatch button (disabled on violation).
 * Right: Live Board of current trips.
 * (design.md §6 screen 4)
 */

import { useState, useEffect } from 'react';
import StatusBadge from '../components/StatusBadge';
import RuleCallout from '../components/RuleCallout';
import { mockTrips, mockDispatchVehicles, mockDispatchDrivers, mockVehicles, mockDrivers } from '../api/mock';
// TODO: swap mock: import { tripsApi, vehiclesApi, driversApi } from '../api/client';

const LIFECYCLE_STEPS = [
  { key: 'draft',      label: 'Draft',      num: 1 },
  { key: 'dispatched', label: 'Dispatched', num: 2 },
  { key: 'on_trip',    label: 'On Trip',    num: 3 },
  { key: 'completed',  label: 'Completed',  num: 4 },
];

function getStepState(stepKey, currentStatus) {
  const order = ['draft', 'dispatched', 'on_trip', 'completed'];
  const stepIdx    = order.indexOf(stepKey);
  const currentIdx = order.indexOf(currentStatus);
  if (currentStatus === 'cancelled') return 'future';
  if (stepIdx < currentIdx)  return 'done';
  if (stepIdx === currentIdx) return 'active';
  return 'future';
}

function TripStepper({ status }) {
  return (
    <div className="stepper" style={{ marginBottom: 20 }}>
      {LIFECYCLE_STEPS.map((step, i) => {
        const state = getStepState(step.key, status || 'draft');
        return (
          <div key={step.key} style={{ display: 'flex', alignItems: 'center', flex: i < LIFECYCLE_STEPS.length - 1 ? 1 : 'none' }}>
            <div className={`step ${state}`} style={{ flexShrink: 0 }}>
              <div className="step-dot">{state === 'done' ? '✓' : step.num}</div>
              <span className="step-label" style={{ fontSize: 11, fontWeight: 600 }}>{step.label}</span>
            </div>
            {i < LIFECYCLE_STEPS.length - 1 && (
              <div className={`step-line ${state === 'done' ? 'done' : ''}`} style={{ flex: 1, minWidth: 20, margin: '0 6px' }} />
            )}
          </div>
        );
      })}
      {/* Cancelled branch */}
      <div style={{ marginLeft: 14, fontSize: 11, color: 'var(--status-red)', display: 'flex', alignItems: 'center', gap: 4 }}>
        <span style={{ color: 'var(--border-subtle)' }}>|</span>
        <span style={{ color: status === 'cancelled' ? 'var(--status-red)' : 'var(--text-muted)' }}>✗ Cancelled</span>
      </div>
    </div>
  );
}

function LiveBoard({ trips, vehicles, drivers }) {
  const active = trips.filter(t => !['completed', 'cancelled', 'draft'].includes(t.status));

  function noteFor(trip) {
    if (trip.status === 'on_trip')    return `${Math.round(trip.planned_distance_km * 0.4)} km to go`;
    if (trip.status === 'dispatched') return 'Awaiting driver';
    return '';
  }

  return (
    <div>
      <div className="label-caps" style={{ marginBottom: 12 }}>Live Board</div>
      <div className="live-board">
        {active.length === 0 && (
          <div className="empty-state"><div className="empty-state-text">No active trips right now.</div></div>
        )}
        {active.map(trip => {
          const v = vehicles.find(vv => vv.id === trip.vehicle_id);
          const d = drivers.find(dd => dd.id === trip.driver_id);
          return (
            <div key={trip.id} className="live-board-item">
              <div style={{ minWidth: 0 }}>
                <div className="flex items-center gap-2">
                  <span className="font-semibold" style={{ fontSize: 13 }}>{trip.id}</span>
                  <StatusBadge value={trip.status} />
                </div>
                <div className="live-board-meta">
                  {trip.source} → {trip.destination}
                </div>
                <div className="live-board-meta">
                  {v?.registration_no ?? '—'} · {d?.name ?? '—'}
                </div>
              </div>
              <div className="live-board-note">{noteFor(trip)}</div>
            </div>
          );
        })}
      </div>

      <div className="divider" />
      <div className="label-caps" style={{ marginBottom: 12 }}>All Trips</div>
      <div className="live-board">
        {trips.slice(0, 6).map(trip => (
          <div key={trip.id} className="live-board-item">
            <div style={{ minWidth: 0 }}>
              <div className="flex items-center gap-2">
                <span style={{ fontSize: 12 }}>{trip.id}</span>
                <StatusBadge value={trip.status} />
              </div>
              <div className="live-board-meta">{trip.source} → {trip.destination}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Trips() {
  const [trips, setTrips]       = useState([]);
  const [avVehicles, setAvVehicles] = useState([]);
  const [avDrivers, setAvDrivers]   = useState([]);
  const [allVehicles, setAllVehicles] = useState([]);
  const [allDrivers, setAllDrivers]   = useState([]);

  const [form, setForm] = useState({
    source: '', destination: '', vehicle_id: '', driver_id: '', cargo_weight_kg: '', planned_distance_km: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [dispatchError, setDispatchError] = useState('');

  useEffect(() => {
    // Replace with real API calls:
    // tripsApi.list().then(setTrips);
    // vehiclesApi.dispatchPool().then(setAvVehicles);
    // driversApi.dispatchPool().then(setAvDrivers);
    setTrips(mockTrips);
    setAvVehicles(mockDispatchVehicles);
    setAvDrivers(mockDispatchDrivers);
    setAllVehicles(mockVehicles);
    setAllDrivers(mockDrivers);
  }, []);

  const selectedVehicle = avVehicles.find(v => v.id === Number(form.vehicle_id));
  const cargoKg         = Number(form.cargo_weight_kg) || 0;
  const capacityKg      = selectedVehicle?.max_load_capacity_kg || 0;
  const capacityExceeded = selectedVehicle && cargoKg > capacityKg;
  const overBy          = capacityExceeded ? cargoKg - capacityKg : 0;

  const canDispatch = (
    form.source.trim() &&
    form.destination.trim() &&
    form.vehicle_id &&
    form.driver_id &&
    !capacityExceeded
  );

  async function handleDispatch(e) {
    e.preventDefault();
    if (!canDispatch) return;
    setSubmitting(true);
    setDispatchError('');
    try {
      // TODO: const newTrip = await tripsApi.create({ ...form, cargo_weight_kg: cargoKg, planned_distance_km: Number(form.planned_distance_km) });
      const newTrip = {
        id: `TRP-${String(Date.now()).slice(-4)}`,
        ...form,
        vehicle_id: Number(form.vehicle_id),
        driver_id: Number(form.driver_id),
        cargo_weight_kg: cargoKg,
        planned_distance_km: Number(form.planned_distance_km),
        status: 'dispatched',
      };
      setTrips(prev => [newTrip, ...prev]);
      setForm({ source: '', destination: '', vehicle_id: '', driver_id: '', cargo_weight_kg: '', planned_distance_km: '' });
    } catch (err) {
      setDispatchError(err.message || 'Dispatch failed. Check capacity and try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1 className="page-title">Trip Dispatcher</h1>
        <p className="page-subtitle">Create, dispatch, and track trips</p>
      </div>

      <div className="two-col">
        {/* ── Left: Stepper + Form ── */}
        <div>
          <div className="card">
            <TripStepper status={form.vehicle_id ? 'draft' : undefined} />

            <div className="label-caps" style={{ marginBottom: 16 }}>New Trip</div>
            <form onSubmit={handleDispatch}>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label" htmlFor="trip-source">Source</label>
                  <input id="trip-source" className="form-input" placeholder="e.g. Depot A"
                    value={form.source}
                    onChange={e => setForm(f => ({ ...f, source: e.target.value }))} required />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="trip-dest">Destination</label>
                  <input id="trip-dest" className="form-input" placeholder="e.g. Site North"
                    value={form.destination}
                    onChange={e => setForm(f => ({ ...f, destination: e.target.value }))} required />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="trip-vehicle">
                  Vehicle <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(available only)</span>
                </label>
                <select id="trip-vehicle" className="form-select"
                  value={form.vehicle_id}
                  onChange={e => setForm(f => ({ ...f, vehicle_id: e.target.value, cargo_weight_kg: '' }))}>
                  <option value="">Select a vehicle…</option>
                  {avVehicles.map(v => (
                    <option key={v.id} value={v.id}>
                      {v.registration_no} — {v.model} (max {v.max_load_capacity_kg.toLocaleString()} kg)
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="trip-driver">
                  Driver <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(available only)</span>
                </label>
                <select id="trip-driver" className="form-select"
                  value={form.driver_id}
                  onChange={e => setForm(f => ({ ...f, driver_id: e.target.value }))}>
                  <option value="">Select a driver…</option>
                  {avDrivers.map(d => (
                    <option key={d.id} value={d.id}>{d.name} — {d.license_no}</option>
                  ))}
                </select>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label" htmlFor="trip-cargo">Cargo Weight (kg)</label>
                  <input id="trip-cargo" className="form-input" type="number" min="0"
                    value={form.cargo_weight_kg}
                    onChange={e => setForm(f => ({ ...f, cargo_weight_kg: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="trip-distance">Planned Distance (km)</label>
                  <input id="trip-distance" className="form-input" type="number" min="0"
                    value={form.planned_distance_km}
                    onChange={e => setForm(f => ({ ...f, planned_distance_km: e.target.value }))} />
                </div>
              </div>

              {/* Live capacity validation */}
              {capacityExceeded && (
                <div style={{ marginBottom: 14 }}>
                  <RuleCallout violation>
                    Vehicle Capacity: {capacityKg.toLocaleString()} kg / Cargo Weight: {cargoKg.toLocaleString()} kg / Capacity exceeded by {overBy.toLocaleString()} kg — dispatch blocked.
                  </RuleCallout>
                </div>
              )}

              {dispatchError && (
                <div style={{ marginBottom: 14 }}>
                  <RuleCallout violation>{dispatchError}</RuleCallout>
                </div>
              )}

              <button
                id="dispatch-btn"
                type="submit"
                className="btn btn-primary"
                disabled={!canDispatch || submitting}
                style={{ width: '100%', justifyContent: 'center', padding: 11 }}
              >
                {submitting ? <span className="spinner" /> : '🚀 Dispatch Trip'}
              </button>
            </form>
          </div>
        </div>

        {/* ── Right: Live Board ── */}
        <div className="card">
          <LiveBoard trips={trips} vehicles={allVehicles} drivers={allDrivers} />
        </div>
      </div>
    </div>
  );
}

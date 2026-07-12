/**
 * pages/Dashboard.jsx — Screen 1
 *
 * Filter bar (Vehicle Type / Status / Region) + 7 KPI cards +
 * Recent Trips table (60%) + Vehicle Status bar chart (40%).
 * (design.md §6 screen 1)
 */

import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import KpiCard from '../components/KpiCard';
import StatusBadge from '../components/StatusBadge';
import { mockDashboard } from '../api/mock';
// TODO: swap mock for real: import { dashboardApi } from '../api/client';

const STATUS_COLORS = {
  available: '#4CAF50',
  on_trip:   '#4A90D9',
  in_shop:   '#E0932E',
  retired:   '#E85D5D',
};

const STATUS_LABELS = {
  available: 'Available',
  on_trip:   'On Trip',
  in_shop:   'In Shop',
  retired:   'Retired',
};

export default function Dashboard() {
  const [data, setData]         = useState(null);
  const [filters, setFilters]   = useState({ type: '', status: '', region: '' });

  useEffect(() => {
    // Replace with: dashboardApi.get(filters).then(setData)
    setData(mockDashboard);
  }, [filters]);

  if (!data) return <div className="empty-state"><div className="spinner" style={{ color: 'var(--accent-primary)' }} /></div>;

  const { kpis, recent_trips, vehicle_status_breakdown } = data;

  const chartData = vehicle_status_breakdown.map(s => ({
    name: STATUS_LABELS[s.status] || s.status,
    count: s.count,
    fill: STATUS_COLORS[s.status] || '#6B6B70',
  }));

  const TRIP_COLS = [
    { key: 'id',                  label: 'Trip ID' },
    { key: 'source',              label: 'From' },
    { key: 'destination',         label: 'To' },
    { key: 'driver',              label: 'Driver' },
    { key: 'vehicle',             label: 'Vehicle' },
    { key: 'planned_distance_km', label: 'Distance (km)' },
    { key: 'status',              label: 'Status', badge: true },
  ];

  return (
    <div className="fade-in">
      <div className="page-header flex items-center justify-between">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Fleet-wide overview and recent activity</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="filter-bar">
        <select
          id="dash-filter-type"
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
          id="dash-filter-status"
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

        <select
          id="dash-filter-region"
          className="filter-select"
          value={filters.region}
          onChange={e => setFilters(f => ({ ...f, region: e.target.value }))}
        >
          <option value="">All Regions</option>
          <option value="north">North</option>
          <option value="south">South</option>
          <option value="east">East</option>
          <option value="west">West</option>
        </select>
      </div>

      {/* 7 KPI Cards */}
      <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(7, 1fr)' }}>
        <KpiCard label="Total Vehicles"        value={kpis.total_vehicles} />
        <KpiCard label="Active Trips"          value={kpis.active_trips} />
        <KpiCard label="Drivers Available"     value={kpis.drivers_available} />
        <KpiCard label="Vehicles in Shop"      value={kpis.vehicles_in_shop} />
        <KpiCard label="Fuel Cost Today"       value={`$${kpis.fuel_cost_today}`} accent />
        <KpiCard label="Trips Today"           value={kpis.trips_completed_today} />
        <KpiCard label="Compliance Rate"       value={`${kpis.compliance_rate}%`} />
      </div>

      {/* Main content: table + chart */}
      <div className="two-col-60-40">
        {/* Recent Trips */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)' }}>
            <span className="font-semibold text-base">Recent Trips</span>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ borderRadius: 0 }}>
              <thead>
                <tr>
                  {TRIP_COLS.map(c => <th key={c.key}>{c.label}</th>)}
                </tr>
              </thead>
              <tbody>
                {recent_trips.map(row => (
                  <tr key={row.id}>
                    {TRIP_COLS.map(c => (
                      <td key={c.key}>
                        {c.badge
                          ? <StatusBadge value={row[c.key]} />
                          : row[c.key] ?? '—'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Vehicle Status Chart */}
        <div className="card">
          <div className="label-caps" style={{ marginBottom: 16 }}>Vehicle Status Breakdown</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} layout="vertical" barCategoryGap="30%">
              <XAxis type="number" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} width={80} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: 'var(--bg-panel)', border: '1px solid var(--border-subtle)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 12 }}
                cursor={{ fill: 'rgba(255,255,255,0.03)' }}
              />
              <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                {chartData.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>

          <div className="divider" />

          {vehicle_status_breakdown.map(s => (
            <div key={s.status} className="flex items-center justify-between" style={{ marginBottom: 6 }}>
              <StatusBadge value={s.status} />
              <span className="font-semibold" style={{ color: STATUS_COLORS[s.status] }}>{s.count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

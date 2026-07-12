/**
 * pages/Reports.jsx — Screen 7 (Reports & Analytics)
 *
 * 4 KPI cards with ROI formula caption +
 * Monthly Revenue bar chart + Top Costliest Vehicles horizontal bar chart.
 * (design.md §6 screen 7)
 */

import { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import KpiCard from '../components/KpiCard';
import { mockReports } from '../api/mock';
// TODO: swap mock: import { reportsApi } from '../api/client';

const CHART_COLORS = ['#D98C2B', '#4A90D9', '#E0932E', '#E85D5D', '#4CAF50', '#6B6B70', '#D98C2B'];

export default function Reports() {
  const [data, setData] = useState(null);

  useEffect(() => {
    // Replace with: reportsApi.get().then(setData)
    setData(mockReports);
  }, []);

  if (!data) return (
    <div className="empty-state">
      <div className="spinner" style={{ color: 'var(--accent-primary)' }} />
    </div>
  );

  const { kpis, monthly_revenue, costliest_vehicles } = data;

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1 className="page-title">Analytics</h1>
        <p className="page-subtitle">Fleet performance and operational cost overview</p>
      </div>

      {/* 4 KPI Cards */}
      <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 24 }}>
        <KpiCard
          label="Fuel Efficiency"
          value={`${kpis.fuel_efficiency_km_per_litre} km/L`}
        />
        <KpiCard
          label="Fleet Utilization"
          value={`${kpis.fleet_utilization_pct}%`}
        />
        <KpiCard
          label="Operational Cost"
          value={`$${kpis.operational_cost.toLocaleString()}`}
          accent
        />
        <KpiCard
          label="Vehicle ROI"
          value={`${kpis.vehicle_roi_pct}%`}
          sub="ROI = (Revenue − Cost) / Cost × 100"
        />
      </div>

      {/* Charts */}
      <div className="two-col">
        {/* Monthly Revenue */}
        <div className="card">
          <div className="label-caps" style={{ marginBottom: 16 }}>Monthly Revenue</div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={monthly_revenue} barCategoryGap="30%">
              <XAxis dataKey="month" tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false}
                tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{ background: 'var(--bg-panel)', border: '1px solid var(--border-subtle)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 12 }}
                formatter={v => [`$${v.toLocaleString()}`, 'Revenue']}
                cursor={{ fill: 'rgba(255,255,255,0.03)' }}
              />
              <Bar dataKey="revenue" radius={[4, 4, 0, 0]}>
                {monthly_revenue.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Top Costliest Vehicles */}
        <div className="card">
          <div className="label-caps" style={{ marginBottom: 16 }}>Top Costliest Vehicles</div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={costliest_vehicles} layout="vertical" barCategoryGap="25%">
              <XAxis type="number" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false}
                tickFormatter={v => `$${v.toLocaleString()}`} />
              <YAxis type="category" dataKey="vehicle_reg" tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
                width={60} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: 'var(--bg-panel)', border: '1px solid var(--border-subtle)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 12 }}
                formatter={v => [`$${v.toLocaleString()}`, 'Total Cost']}
                cursor={{ fill: 'rgba(255,255,255,0.03)' }}
              />
              <Bar dataKey="total_cost" radius={[0, 4, 4, 0]}>
                {costliest_vehicles.map((_, i) => (
                  <Cell key={i} fill={['#E85D5D', '#E0932E', '#D98C2B', '#4A90D9'][i % 4]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

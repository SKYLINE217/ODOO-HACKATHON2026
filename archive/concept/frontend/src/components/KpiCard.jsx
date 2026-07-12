/**
 * components/KpiCard.jsx
 *
 * Large number + small label. Used on Dashboard (7 cards) and Analytics (4 cards).
 * Plain --text-primary number, --text-secondary label, thin border — per design.md §5.
 * No icon, no gradient.
 *
 * Usage: <KpiCard label="Active Trips" value={7} />
 *        <KpiCard label="Fleet Utilization" value="71%" accent />
 */

export default function KpiCard({ label, value, accent = false, sub }) {
  return (
    <div className="card card-sm" style={{ textAlign: 'left' }}>
      <div
        className="text-3xl font-extrabold"
        style={{ color: accent ? 'var(--accent-primary)' : 'var(--text-primary)', letterSpacing: '-0.03em' }}
      >
        {value ?? '—'}
      </div>
      {sub && (
        <div className="text-xs" style={{ color: 'var(--text-muted)', marginTop: 2 }}>
          {sub}
        </div>
      )}
      <div className="label-caps" style={{ marginTop: 6 }}>
        {label}
      </div>
    </div>
  );
}

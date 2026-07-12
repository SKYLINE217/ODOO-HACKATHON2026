/**
 * components/StatusBadge.jsx
 *
 * Maps enum strings → colored pill badges.
 * Colors from design.md §2. Always renders text label (accessibility).
 * Covers: vehicle_status, driver_status, trip_status, maintenance_status, roles.
 *
 * Usage: <StatusBadge value="available" />
 *        <StatusBadge value="fleet_manager" type="role" />
 */

const STATUS_MAP = {
  // Vehicle / Driver operational status
  available:   { label: 'Available',   cls: 'badge-green'  },
  on_trip:     { label: 'On Trip',     cls: 'badge-blue'   },
  in_shop:     { label: 'In Shop',     cls: 'badge-orange' },
  retired:     { label: 'Retired',     cls: 'badge-red'    },
  off_duty:    { label: 'Off Duty',    cls: 'badge-gray'   },
  suspended:   { label: 'Suspended',   cls: 'badge-orange' },

  // Driver safety (license compliance)
  expired:     { label: 'Expired',     cls: 'badge-red'    },
  compliant:   { label: 'Compliant',   cls: 'badge-green'  },

  // Trip lifecycle
  draft:       { label: 'Draft',       cls: 'badge-gray'   },
  dispatched:  { label: 'Dispatched',  cls: 'badge-blue'   },
  completed:   { label: 'Completed',   cls: 'badge-green'  },
  cancelled:   { label: 'Cancelled',   cls: 'badge-red'    },

  // Maintenance
  scheduled:   { label: 'Scheduled',   cls: 'badge-blue'   },
  in_progress: { label: 'In Progress', cls: 'badge-orange' },
  done:        { label: 'Done',        cls: 'badge-green'  },

  // Roles
  fleet_manager:    { label: 'Fleet Manager',    cls: 'badge-blue'   },
  driver:           { label: 'Driver',           cls: 'badge-blue'   },
  safety_officer:   { label: 'Safety Officer',   cls: 'badge-blue'   },
  financial_analyst:{ label: 'Financial Analyst',cls: 'badge-blue'   },
};

export default function StatusBadge({ value, className = '' }) {
  if (!value) return null;
  const entry = STATUS_MAP[value] || { label: value, cls: 'badge-gray' };

  return (
    <span className={`status-badge ${entry.cls} ${className}`}>
      {entry.label}
    </span>
  );
}

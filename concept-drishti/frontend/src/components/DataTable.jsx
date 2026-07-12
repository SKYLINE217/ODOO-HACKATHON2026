/**
 * components/DataTable.jsx
 *
 * Reusable table with column definitions, optional client-side filter/search.
 * Status columns render via StatusBadge automatically.
 *
 * Usage:
 *   <DataTable
 *     columns={[
 *       { key: 'registration_no', label: 'Reg No.' },
 *       { key: 'status', label: 'Status', badge: true },
 *       { key: 'type', label: 'Type' },
 *     ]}
 *     rows={vehicles}
 *     searchKeys={['registration_no', 'model']}
 *   />
 */

import { useState, useMemo } from 'react';
import StatusBadge from './StatusBadge';

export default function DataTable({
  columns = [],
  rows = [],
  searchKeys = [],
  actions,        // (row) => JSX — optional action column
  emptyMessage = 'No records found.',
}) {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search.trim() || searchKeys.length === 0) return rows;
    const q = search.toLowerCase();
    return rows.filter(row =>
      searchKeys.some(k => String(row[k] ?? '').toLowerCase().includes(q))
    );
  }, [rows, search, searchKeys]);

  return (
    <div>
      {searchKeys.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          <input
            className="search-input"
            placeholder="Search…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      )}

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              {columns.map(col => (
                <th key={col.key}>{col.label}</th>
              ))}
              {actions && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (actions ? 1 : 0)}>
                  <div className="empty-state">
                    <div className="empty-state-icon">📋</div>
                    <div className="empty-state-text">{emptyMessage}</div>
                  </div>
                </td>
              </tr>
            ) : (
              filtered.map((row, i) => (
                <tr key={row.id ?? i}>
                  {columns.map(col => (
                    <td key={col.key}>
                      {col.badge
                        ? <StatusBadge value={row[col.key]} />
                        : col.render
                          ? col.render(row[col.key], row)
                          : (row[col.key] ?? '—')}
                    </td>
                  ))}
                  {actions && <td>{actions(row)}</td>}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

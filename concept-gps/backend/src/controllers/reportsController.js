'use strict';

const db = require('../config/db');
const { createError } = require('../middleware/errorHandler');

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Convert an array of objects to CSV text. */
function toCsv(rows) {
  if (!rows || rows.length === 0) return '';
  const headers = Object.keys(rows[0]);
  const lines   = rows.map(row =>
    headers.map(h => {
      const val = row[h] == null ? '' : String(row[h]);
      // Wrap in quotes if value contains comma, newline, or quote
      return /[",\n]/.test(val) ? `"${val.replace(/"/g, '""')}"` : val;
    }).join(',')
  );
  return [headers.join(','), ...lines].join('\n');
}

// ── Controllers ──────────────────────────────────────────────────────────────

/**
 * GET /api/v1/reports/fuel-efficiency
 * Per-vehicle: SUM(actual_distance_km) / SUM(fuel_consumed_liters)
 * Formula: database.md §9
 */
async function fuelEfficiency(req, res, next) {
  try {
    const rows = await db.query(
      `SELECT
         v.id AS vehicle_id,
         v.registration_number,
         v.name_model,
         v.type,
         COALESCE(SUM(t.actual_distance_km), 0)    AS total_distance_km,
         COALESCE(SUM(t.fuel_consumed_liters), 0)  AS total_fuel_liters,
         CASE
           WHEN SUM(t.fuel_consumed_liters) > 0
           THEN ROUND(SUM(t.actual_distance_km) / SUM(t.fuel_consumed_liters), 2)
           ELSE NULL
         END AS km_per_liter
       FROM vehicles v
       LEFT JOIN trips t
         ON t.vehicle_id = v.id AND t.status = 'completed'
       WHERE v.status != 'retired'
       GROUP BY v.id, v.registration_number, v.name_model, v.type
       ORDER BY km_per_liter DESC`
    );
    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
}

/**
 * GET /api/v1/reports/utilization?from=YYYY-MM-DD&to=YYYY-MM-DD
 * Fleet-wide utilization % over a date range.
 * Formula: on_trip vehicles at any point in range / total non-retired vehicles
 * Simplified: counts distinct vehicles that had a dispatched/completed trip in range
 */
async function utilization(req, res, next) {
  try {
    const { from, to } = req.query;

    // Total non-retired vehicles
    const [totalRow] = await db.query(
      "SELECT COUNT(*) AS total FROM vehicles WHERE status != 'retired'"
    );
    const total = parseInt(totalRow.total) || 0;

    // Vehicles that were active (had a dispatched or completed trip) in the date range
    let activeQuery = `
      SELECT COUNT(DISTINCT vehicle_id) AS active
      FROM trips
      WHERE status IN ('dispatched','completed')
    `;
    const params = [];
    if (from) { activeQuery += ' AND DATE(dispatched_at) >= ?'; params.push(from); }
    if (to)   { activeQuery += ' AND DATE(COALESCE(completed_at, NOW())) <= ?'; params.push(to); }

    const [activeRow] = await db.query(activeQuery, params);
    const active      = parseInt(activeRow.active) || 0;
    const utilPct     = total > 0 ? parseFloat(((active / total) * 100).toFixed(1)) : 0;

    res.json({
      success: true,
      data: {
        total_non_retired_vehicles: total,
        vehicles_with_trips_in_range: active,
        utilization_pct: utilPct,
        from: from || null,
        to:   to   || null,
      },
    });
  } catch (err) { next(err); }
}

/**
 * GET /api/v1/reports/operational-cost
 * Per-vehicle: SUM(fuel_logs.cost) + SUM(maintenance_logs.cost)
 * Formula: database.md §9
 */
async function operationalCost(req, res, next) {
  try {
    const rows = await db.query(
      `SELECT
         v.id AS vehicle_id,
         v.registration_number,
         v.name_model,
         v.type,
         COALESCE(fl.cost_total, 0)  AS total_fuel_cost,
         COALESCE(ml.cost_total, 0)  AS total_maintenance_cost,
         COALESCE(fl.cost_total, 0) +
         COALESCE(ml.cost_total, 0)  AS total_operational_cost
       FROM vehicles v
       LEFT JOIN (
         SELECT vehicle_id, SUM(cost) AS cost_total FROM fuel_logs GROUP BY vehicle_id
       ) fl ON fl.vehicle_id = v.id
       LEFT JOIN (
         SELECT vehicle_id, SUM(cost) AS cost_total FROM maintenance_logs GROUP BY vehicle_id
       ) ml ON ml.vehicle_id = v.id
       ORDER BY total_operational_cost DESC`
    );
    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
}

/**
 * GET /api/v1/reports/roi
 * Per-vehicle ROI = (SUM(trips.revenue) - (SUM(maintenance.cost) + SUM(fuel.cost))) / vehicles.acquisition_cost
 * Formula: database.md §9
 */
async function roi(req, res, next) {
  try {
    const rows = await db.query(
      `SELECT
         v.id AS vehicle_id,
         v.registration_number,
         v.name_model,
         v.type,
         v.acquisition_cost,
         COALESCE(rev.total_revenue, 0)   AS total_revenue,
         COALESCE(fuel.total_fuel, 0)     AS total_fuel_cost,
         COALESCE(maint.total_maint, 0)   AS total_maintenance_cost,
         COALESCE(rev.total_revenue, 0) - COALESCE(fuel.total_fuel, 0) - COALESCE(maint.total_maint, 0)
                                          AS net_profit,
         CASE
           WHEN v.acquisition_cost > 0
           THEN ROUND(
             (COALESCE(rev.total_revenue, 0) - COALESCE(fuel.total_fuel, 0) - COALESCE(maint.total_maint, 0))
             / v.acquisition_cost, 4
           )
           ELSE NULL
         END AS roi
       FROM vehicles v
       LEFT JOIN (
         SELECT vehicle_id, SUM(revenue) AS total_revenue
         FROM trips WHERE status = 'completed' AND revenue IS NOT NULL
         GROUP BY vehicle_id
       ) rev   ON rev.vehicle_id   = v.id
       LEFT JOIN (
         SELECT vehicle_id, SUM(cost) AS total_fuel
         FROM fuel_logs GROUP BY vehicle_id
       ) fuel  ON fuel.vehicle_id  = v.id
       LEFT JOIN (
         SELECT vehicle_id, SUM(cost) AS total_maint
         FROM maintenance_logs GROUP BY vehicle_id
       ) maint ON maint.vehicle_id = v.id
       ORDER BY roi DESC`
    );
    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
}

/**
 * GET /api/v1/reports/export.csv?report=<name>
 * CSV export for: fuel-efficiency | utilization | operational-cost | roi
 */
async function exportCsv(req, res, next) {
  try {
    const { report } = req.query;
    const allowed = ['fuel-efficiency', 'utilization', 'operational-cost', 'roi'];
    if (!report || !allowed.includes(report)) {
      return next(createError(
        `Invalid report name. Must be one of: ${allowed.join(', ')}.`,
        400, 'VALIDATION_ERROR'
      ));
    }

    // Re-use the controller logic to get the data, then convert to CSV
    const mockRes = {
      _data: null,
      json(payload) { this._data = payload.data; },
    };

    const reportFns = {
      'fuel-efficiency':   fuelEfficiency,
      'utilization':       utilization,
      'operational-cost':  operationalCost,
      'roi':               roi,
    };

    // Call the appropriate report function synchronously-ish via promise
    await new Promise((resolve, reject) => {
      const fakeNext = (err) => (err ? reject(err) : resolve());
      reportFns[report](req, mockRes, fakeNext).then(resolve).catch(reject);
    });

    const data = Array.isArray(mockRes._data)
      ? mockRes._data
      : [mockRes._data];

    const csv = toCsv(data);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${report}-${Date.now()}.csv"`);
    res.send(csv);
  } catch (err) { next(err); }
}

module.exports = { fuelEfficiency, utilization, operationalCost, roi, exportCsv };

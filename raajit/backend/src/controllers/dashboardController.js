'use strict';

const db = require('../config/db');

// GET /api/v1/dashboard?type=&status=&region=
async function getDashboard(req, res, next) {
  try {
    const { type, region } = req.query;
    const vehicleConditions = [];
    const vehicleParams     = [];

    if (type)   { vehicleConditions.push('type = ?');   vehicleParams.push(type);   }
    if (region) { vehicleConditions.push('region = ?'); vehicleParams.push(region); }

    const baseWhere = vehicleConditions.length
      ? `AND ${vehicleConditions.join(' AND ')}`
      : '';

    // Vehicle counts
    const [vehicleStats] = await db.query(
      `SELECT
         COUNT(*) AS total_vehicles,
         SUM(status != 'retired') AS active_vehicles,
         SUM(status = 'available') AS available_vehicles,
         SUM(status = 'in_shop') AS vehicles_in_maintenance,
         SUM(status = 'on_trip') AS vehicles_on_trip
       FROM vehicles
       WHERE 1=1 ${baseWhere}`,
      vehicleParams
    );

    // Trip counts
    const [tripStats] = await db.query(
      `SELECT
         SUM(status = 'dispatched') AS active_trips,
         SUM(status = 'draft') AS pending_trips
       FROM trips`
    );

    // Drivers on duty (on_trip)
    const [driverStats] = await db.query(
      `SELECT SUM(status = 'on_trip') AS drivers_on_duty FROM drivers`
    );

    // Fleet utilization = on_trip / non-retired
    const activeVehicles = parseInt(vehicleStats.active_vehicles) || 0;
    const onTrip         = parseInt(vehicleStats.vehicles_on_trip) || 0;
    const utilization    = activeVehicles > 0
      ? parseFloat(((onTrip / activeVehicles) * 100).toFixed(1))
      : 0;

    res.json({
      success: true,
      data: {
        active_vehicles:        parseInt(vehicleStats.active_vehicles)      || 0,
        available_vehicles:     parseInt(vehicleStats.available_vehicles)   || 0,
        vehicles_in_maintenance:parseInt(vehicleStats.vehicles_in_maintenance) || 0,
        active_trips:           parseInt(tripStats.active_trips)            || 0,
        pending_trips:          parseInt(tripStats.pending_trips)           || 0,
        drivers_on_duty:        parseInt(driverStats.drivers_on_duty)       || 0,
        fleet_utilization_pct:  utilization,
      },
    });
  } catch (err) { next(err); }
}

module.exports = { getDashboard };

'use strict';
const db = require('../config/db');

let sseClients = [];

exports.streamLocations = (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  sseClients.push(res);

  req.on('close', () => {
    sseClients = sseClients.filter(client => client !== res);
  });
};

exports.updateLocation = async (req, res) => {
  try {
    const { vehicle_id, latitude, longitude } = req.body;
    
    if (!vehicle_id || typeof latitude !== 'number' || typeof longitude !== 'number') {
      return res.status(400).json({ success: false, error: 'Missing or invalid location payload data' });
    }
    
    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      return res.status(400).json({ success: false, error: 'Coordinates out of bounds' });
    }

    if (req.user.role === 'driver') {
      const driverTrips = await db.query(
        `SELECT t.id FROM trips t 
         JOIN drivers d ON t.driver_id = d.id 
         WHERE d.name = (SELECT name FROM users WHERE id = ?) 
           AND t.vehicle_id = ? 
           AND t.status = 'Dispatched'`,
        [req.user.id, vehicle_id]
      );
      if (driverTrips.length === 0) {
        return res.status(403).json({ success: false, error: 'Forbidden: You are not dispatched to this vehicle.' });
      }
    }

    await db.query(
      `INSERT INTO vehicle_locations (vehicle_id, latitude, longitude)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE latitude = VALUES(latitude), longitude = VALUES(longitude), recorded_at = CURRENT_TIMESTAMP`,
      [vehicle_id, latitude, longitude]
    );

    // Fetch full details to broadcast
    const [updatedLoc] = await db.query(`
      SELECT 
        vl.vehicle_id, 
        vl.latitude, 
        vl.longitude, 
        vl.recorded_at,
        v.reg_no,
        t.source,
        t.destination,
        d.name AS driver_name
      FROM vehicle_locations vl
      JOIN vehicles v ON vl.vehicle_id = v.id
      LEFT JOIN trips t ON t.vehicle_id = v.id AND t.status = 'Dispatched'
      LEFT JOIN drivers d ON t.driver_id = d.id
      WHERE vl.vehicle_id = ?
    `, [vehicle_id]);

    if (updatedLoc && sseClients.length > 0) {
      const data = JSON.stringify(updatedLoc);
      sseClients.forEach(client => client.write(`data: ${data}\n\n`));
    }

    res.json({ success: true, data: { message: 'Location updated' } });
  } catch (error) {
    console.error('[Tracking Error]', error);
    res.status(500).json({ success: false, error: 'Server error updating location' });
  }
};

exports.getActiveLocations = async (req, res) => {
  try {
    const locations = await db.query(`
      SELECT 
        vl.vehicle_id, 
        vl.latitude, 
        vl.longitude, 
        vl.recorded_at,
        v.reg_no,
        t.source,
        t.destination,
        d.name AS driver_name
      FROM vehicle_locations vl
      JOIN vehicles v ON vl.vehicle_id = v.id
      LEFT JOIN trips t ON t.vehicle_id = v.id AND t.status = 'Dispatched'
      LEFT JOIN drivers d ON t.driver_id = d.id
    `);
    
    res.json({ success: true, data: locations });
  } catch (error) {
    console.error('[Tracking Error]', error);
    res.status(500).json({ success: false, error: 'Server error fetching locations' });
  }
};

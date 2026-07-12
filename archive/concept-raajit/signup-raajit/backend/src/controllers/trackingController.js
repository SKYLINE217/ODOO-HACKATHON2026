'use strict';
const db = require('../config/db');

exports.updateLocation = async (req, res) => {
  try {
    const { vehicle_id, latitude, longitude } = req.body;
    
    if (!vehicle_id || !latitude || !longitude) {
      return res.status(400).json({ success: false, error: 'Missing location payload data' });
    }

    await db.query(
      `INSERT INTO vehicle_locations (vehicle_id, latitude, longitude)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE latitude = VALUES(latitude), longitude = VALUES(longitude), recorded_at = CURRENT_TIMESTAMP`,
      [vehicle_id, latitude, longitude]
    );

    res.json({ success: true, data: { message: 'Location updated' } });
  } catch (error) {
    console.error('[Tracking Error]', error);
    res.status(500).json({ success: false, error: 'Server error updating location' });
  }
};

exports.getActiveLocations = async (req, res) => {
  try {
    const [locations] = await db.query(`
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

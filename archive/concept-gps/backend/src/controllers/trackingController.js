const db = require('../config/db');

exports.updateLocation = async (req, res) => {
  try {
    const { vehicle_id, trip_id, latitude, longitude } = req.body;
    
    if (!vehicle_id || !latitude || !longitude) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const [result] = await db.query(
      'INSERT INTO vehicle_locations (vehicle_id, trip_id, latitude, longitude) VALUES (?, ?, ?, ?)',
      [vehicle_id, trip_id || null, latitude, longitude]
    );

    res.status(201).json({
      success: true,
      message: 'Location updated',
      data: { id: result.insertId }
    });
  } catch (error) {
    console.error('Error updating location:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getActiveLocations = async (req, res) => {
  try {
    // Fetch the latest location for vehicles that are on a trip
    const [rows] = await db.query(`
      SELECT 
        v.id as vehicle_id,
        v.registration_number,
        v.name_model,
        t.id as trip_id,
        t.source,
        t.destination,
        d.name as driver_name,
        vl.latitude,
        vl.longitude,
        vl.recorded_at
      FROM vehicles v
      JOIN trips t ON v.id = t.vehicle_id AND t.status IN ('dispatched', 'draft')
      JOIN drivers d ON t.driver_id = d.id
      JOIN (
        SELECT vehicle_id, MAX(recorded_at) as latest_record
        FROM vehicle_locations
        GROUP BY vehicle_id
      ) latest ON v.id = latest.vehicle_id
      JOIN vehicle_locations vl ON latest.vehicle_id = vl.vehicle_id AND latest.latest_record = vl.recorded_at
      WHERE v.status = 'on_trip'
    `);

    res.json({
      success: true,
      data: rows
    });
  } catch (error) {
    console.error('Error fetching active locations:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

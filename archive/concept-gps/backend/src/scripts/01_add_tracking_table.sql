-- Add vehicle_locations table for GPS tracking
CREATE TABLE IF NOT EXISTS vehicle_locations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  vehicle_id INT NOT NULL,
  trip_id INT NULL,
  latitude DECIMAL(10,8) NOT NULL,
  longitude DECIMAL(11,8) NOT NULL,
  recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_locations_vehicle FOREIGN KEY (vehicle_id) REFERENCES vehicles(id),
  CONSTRAINT fk_locations_trip FOREIGN KEY (trip_id) REFERENCES trips(id)
) ENGINE=InnoDB;

'use strict';

const bcrypt = require('bcryptjs');
const db = require('./db');

const DEMO_USERS = [
  {
    name: 'Fleet Manager Demo',
    email: 'fleet@transitops.demo',
    password: 'password123',
    role: 'fleet_manager'
  },
  {
    name: 'Dispatcher Demo',
    email: 'dispatcher@transitops.demo',
    password: 'password123',
    role: 'dispatcher'
  },
  {
    name: 'Safety Officer Demo',
    email: 'safety@transitops.demo',
    password: 'password123',
    role: 'safety_officer'
  },
  {
    name: 'Finance Demo',
    email: 'finance@transitops.demo',
    password: 'password123',
    role: 'financial_analyst'
  }
];

async function seedDatabase() {
  try {
    console.log('[Seed] Checking for demo accounts...');
    
    // Check if table exists first
    try {
      await db.query('SELECT 1 FROM users LIMIT 1');
    } catch (err) {
      console.log('[Seed] Users table does not exist or database is not reachable. Skipping seed.');
      return;
    }

    for (const u of DEMO_USERS) {
      const existing = await db.query('SELECT id FROM users WHERE email = ?', [u.email]);
      if (existing.length === 0) {
        const passwordHash = await bcrypt.hash(u.password, 10);
        await db.query(
          'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
          [u.name, u.email, passwordHash, u.role]
        );
        console.log(`[Seed] Created demo user: ${u.email} (${u.role})`);
      }
    }
    
    // Seed Vehicles
    const vehiclesCount = await db.query('SELECT COUNT(*) as c FROM vehicles');
    if (vehiclesCount[0].c < 10) {
      console.log('[Seed] Seeding vehicles...');
      // Clear existing to prevent duplicates if partially seeded
      await db.query('SET FOREIGN_KEY_CHECKS = 0');
      await db.query('TRUNCATE TABLE vehicles');
      await db.query('TRUNCATE TABLE drivers');
      await db.query('TRUNCATE TABLE trips');
      await db.query('TRUNCATE TABLE maintenance_records');
      await db.query('TRUNCATE TABLE fuel_logs');
      await db.query('TRUNCATE TABLE expenses');
      await db.query('SET FOREIGN_KEY_CHECKS = 1');

      await db.query(`
        INSERT INTO vehicles (id, reg_no, name_model, type, capacity, capacity_kg, odometer, acquisition_cost, status) VALUES 
        (1, 'GJ-01-AB-1234', 'Tata Ace', 'Mini', 'Small', 1000, 15000, 500000.00, 'Available'),
        (2, 'GJ-01-CD-5678', 'Ashok Leyland Dost', 'Van', 'Medium', 2500, 45000, 800000.00, 'On Trip'),
        (3, 'GJ-01-EF-9012', 'Mahindra Blazo', 'Truck', 'Large', 10000, 120000, 2500000.00, 'In Shop'),
        (4, 'MH-02-XY-3344', 'Tata 407', 'Truck', 'Medium', 3500, 32000, 950000.00, 'Available'),
        (5, 'DL-04-ZZ-9999', 'Eicher Pro 2049', 'Truck', 'Large', 4900, 56000, 1200000.00, 'On Trip'),
        (6, 'RJ-14-KL-1111', 'Mahindra Bolero Pickup', 'Van', 'Small', 1500, 22000, 600000.00, 'Available'),
        (7, 'UP-32-MN-2222', 'Tata Winger Cargo', 'Van', 'Medium', 2000, 89000, 750000.00, 'In Shop'),
        (8, 'KA-01-PQ-8888', 'BharatBenz 1215C', 'Truck', 'Large', 12000, 10500, 2800000.00, 'Available'),
        (9, 'TS-09-RS-7777', 'Maruti Suzuki Super Carry', 'Mini', 'Small', 740, 18000, 450000.00, 'Available'),
        (10, 'TN-22-UV-6666', 'Tata Signa', 'Truck', 'Large', 15000, 215000, 3500000.00, 'Retired')
      `);

      console.log('[Seed] Seeding drivers...');
      await db.query(`
        INSERT INTO drivers (id, name, license_no, category, license_expiry, contact, safety_status, status) VALUES 
        (1, 'Raj Patel', 'DL-12345678', 'Heavy', '2030-05-15', '9876543210', 'Available', 'Available'),
        (2, 'Sunil Kumar', 'DL-87654321', 'Medium', '2022-01-10', '9876543211', 'Available', 'Off Duty'),
        (3, 'Amit Singh', 'DL-11223344', 'Heavy', '2028-11-20', '9876543212', 'Suspended', 'Off Duty'),
        (4, 'Vikram Sharma', 'DL-55667788', 'Light', '2027-04-12', '9876543213', 'Available', 'On Trip'),
        (5, 'Arif Khan', 'DL-99887766', 'Heavy', '2029-08-30', '9876543214', 'Available', 'On Trip'),
        (6, 'Ravi Teja', 'DL-10293847', 'Medium', '2026-12-05', '9876543215', 'Available', 'Available'),
        (7, 'Manoj Desai', 'DL-56473829', 'Heavy', '2025-03-22', '9876543216', 'Suspended', 'Off Duty'),
        (8, 'Kishore Reddy', 'DL-90817263', 'Light', '2031-01-18', '9876543217', 'Available', 'Available')
      `);

      console.log('[Seed] Seeding trips...');
      await db.query(`
        INSERT INTO trips (id, trip_code, source, destination, vehicle_id, driver_id, cargo_weight_kg, planned_distance_km, status) VALUES 
        (1, 'TR001', 'Ahmedabad', 'Surat', 1, 1, 800, 250, 'Completed'),
        (2, 'TR002', 'Vadodara', 'Mumbai', 2, 4, 2000, 400, 'Dispatched'),
        (3, 'TR003', 'Surat', 'Pune', 5, 5, 4500, 350, 'Dispatched'),
        (4, 'TR004', 'Ahmedabad', 'Jaipur', 4, 6, 3000, 650, 'Completed'),
        (5, 'TR005', 'Rajkot', 'Ahmedabad', 6, 8, 1200, 215, 'Completed'),
        (6, 'TR006', 'Mumbai', 'Goa', 8, 1, 11000, 580, 'Completed'),
        (7, 'TR007', 'Pune', 'Bangalore', 2, 4, 2200, 840, 'Completed'),
        (8, 'TR008', 'Jaipur', 'Delhi', 5, 5, 4000, 280, 'Completed'),
        (9, 'TR009', 'Surat', 'Indore', 9, 8, 700, 420, 'Completed'),
        (10, 'TR010', 'Delhi', 'Chandigarh', 4, 6, 3100, 250, 'Cancelled'),
        (11, 'TR011', 'Bangalore', 'Chennai', 8, 1, 11500, 350, 'Completed'),
        (12, 'TR012', 'Chennai', 'Hyderabad', 2, 4, 2300, 620, 'Draft'),
        (13, 'TR013', 'Hyderabad', 'Nagpur', 6, 8, 1400, 500, 'Draft'),
        (14, 'TR014', 'Nagpur', 'Bhopal', 1, 1, 900, 350, 'Draft'),
        (15, 'TR015', 'Bhopal', 'Agra', 5, 5, 4800, 540, 'Draft')
      `);
      
      console.log('[Seed] Seeding maintenance...');
      await db.query(`
        INSERT INTO maintenance_records (vehicle_id, service_type, cost, service_date, status) VALUES 
        (3, 'Engine Overhaul', 45000.00, '2026-07-01', 'Active'),
        (7, 'Brake Replacement', 12000.00, '2026-07-05', 'Active'),
        (1, 'Routine Service', 3500.00, '2026-06-15', 'Completed'),
        (2, 'Tire Change', 18000.00, '2026-05-20', 'Completed'),
        (4, 'Oil Change', 4500.00, '2026-06-25', 'Completed'),
        (8, 'Transmission Repair', 55000.00, '2026-04-10', 'Completed'),
        (5, 'Battery Replacement', 8000.00, '2026-05-05', 'Completed'),
        (10, 'Major Collision Repair', 150000.00, '2025-12-01', 'Completed')
      `);

      console.log('[Seed] Seeding fuel logs...');
      await db.query(`
        INSERT INTO fuel_logs (vehicle_id, log_date, liters, fuel_cost) VALUES 
        (1, '2026-06-01', 40.5, 3800.00),
        (2, '2026-06-05', 65.0, 6100.00),
        (4, '2026-06-10', 80.0, 7500.00),
        (5, '2026-06-12', 120.0, 11200.00),
        (6, '2026-06-15', 35.0, 3200.00),
        (8, '2026-06-18', 250.0, 23500.00),
        (9, '2026-06-20', 25.0, 2300.00),
        (1, '2026-06-25', 42.0, 3950.00),
        (2, '2026-06-28', 70.0, 6500.00),
        (4, '2026-07-01', 85.0, 7900.00),
        (5, '2026-07-03', 115.0, 10800.00),
        (6, '2026-07-05', 38.0, 3500.00),
        (8, '2026-07-08', 240.0, 22500.00),
        (2, '2026-07-10', 60.0, 5600.00),
        (5, '2026-07-11', 130.0, 12100.00)
      `);

      console.log('[Seed] Seeding expenses...');
      await db.query(`
        INSERT INTO expenses (trip_id, vehicle_id, toll, other) VALUES 
        (1, 1, 250.00, 100.00),
        (4, 4, 850.00, 300.00),
        (5, 6, 120.00, 50.00),
        (6, 8, 1500.00, 800.00),
        (7, 2, 1100.00, 450.00),
        (8, 5, 450.00, 200.00),
        (9, 9, 350.00, 0.00),
        (11, 8, 900.00, 500.00),
        (NULL, 1, 0.00, 150.00),
        (NULL, 2, 0.00, 300.00),
        (NULL, 5, 0.00, 850.00),
        (NULL, 8, 0.00, 1200.00)
      `);
    }

    console.log('[Seed] Demo accounts and sample data ready.');
  } catch (err) {
    console.error('[Seed] Error seeding database:', err.message);
  }
}

module.exports = seedDatabase;

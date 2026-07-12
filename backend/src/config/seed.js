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
    name: 'Raj Patel',
    email: 'driver@transitops.demo',
    password: 'password123',
    role: 'driver'
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
    if (vehiclesCount[0].c === 0) {
      console.log('[Seed] Seeding vehicles...');
      await db.query(`
        INSERT INTO vehicles (reg_no, name_model, type, capacity, capacity_kg, odometer, acquisition_cost, status) VALUES 
        ('GJ-01-AB-1234', 'Tata Ace', 'Mini', 'Small', 1000, 15000, 500000.00, 'Available'),
        ('GJ-01-CD-5678', 'Ashok Leyland Dost', 'Van', 'Medium', 2500, 45000, 800000.00, 'On Trip'),
        ('GJ-01-EF-9012', 'Mahindra Blazo', 'Truck', 'Large', 10000, 120000, 2500000.00, 'In Shop')
      `);
    }

    // Seed Drivers
    const driversCount = await db.query('SELECT COUNT(*) as c FROM drivers');
    if (driversCount[0].c === 0) {
      console.log('[Seed] Seeding drivers...');
      await db.query(`
        INSERT INTO drivers (name, license_no, category, license_expiry, contact, safety_status, status) VALUES 
        ('Raj Patel', 'DL-12345678', 'Heavy', '2030-05-15', '9876543210', 'Available', 'Available'),
        ('Sunil Kumar', 'DL-87654321', 'Medium', '2022-01-10', '9876543211', 'Available', 'Off Duty'),
        ('Amit Singh', 'DL-11223344', 'Heavy', '2028-11-20', '9876543212', 'Suspended', 'Off Duty')
      `);
    }

    // Seed Trips
    const tripsCount = await db.query('SELECT COUNT(*) as c FROM trips');
    if (tripsCount[0].c === 0) {
      console.log('[Seed] Seeding trips...');
      await db.query(`
        INSERT INTO trips (trip_code, source, destination, vehicle_id, driver_id, cargo_weight_kg, planned_distance_km, status) VALUES 
        ('TR001', 'Ahmedabad', 'Surat', 1, 1, 800, 250, 'Completed'),
        ('TR002', 'Vadodara', 'Mumbai', 2, 2, 2000, 400, 'Dispatched')
      `);
    }
    
    // Seed Maintenance
    const maintCount = await db.query('SELECT COUNT(*) as c FROM maintenance_records');
    if (maintCount[0].c === 0) {
      console.log('[Seed] Seeding maintenance...');
      await db.query(`
        INSERT INTO maintenance_records (vehicle_id, service_type, cost, service_date, status) VALUES 
        (3, 'Engine Overhaul', 45000.00, '2026-07-01', 'Active')
      `);
    }

    console.log('[Seed] Demo accounts and sample data ready.');
  } catch (err) {
    console.error('[Seed] Error seeding database:', err.message);
  }
}

module.exports = seedDatabase;

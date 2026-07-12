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
    name: 'Driver Demo',
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
    console.log('[Seed] Demo accounts ready.');
  } catch (err) {
    console.error('[Seed] Error seeding database:', err.message);
  }
}

module.exports = seedDatabase;

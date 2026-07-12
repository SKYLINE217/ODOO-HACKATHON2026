'use strict';
require('dotenv').config();
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function initDb() {
  try {
    console.log('Connecting to MySQL to initialize DB...');
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT) || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASS || 'Sumit123'
    });
    
    console.log('Creating database if not exists...');
    await connection.query('CREATE DATABASE IF NOT EXISTS transitops CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
    
    console.log('Using database transitops...');
    await connection.query('USE transitops');
    
    console.log('Creating users table...');
    const schemaSql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf-8');
    
    // Quick parse to run statements (super simple split by ;)
    const statements = schemaSql.split(';').map(s => s.trim()).filter(s => s.length > 0);
    for (const stmt of statements) {
      if (!stmt.toLowerCase().startsWith('--')) {
        await connection.query(stmt);
      }
    }
    
    console.log('Database initialized successfully.');
    await connection.end();
  } catch (err) {
    console.error('Error initializing DB:', err);
  }
}

initDb();

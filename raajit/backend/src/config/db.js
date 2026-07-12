'use strict';

const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host:               process.env.DB_HOST     || 'localhost',
  port:               Number(process.env.DB_PORT) || 3306,
  user:               process.env.DB_USER     || 'root',
  password:           process.env.DB_PASS     || '',
  database:           process.env.DB_NAME     || 'transitops',
  waitForConnections: true,
  connectionLimit:    10,
  queueLimit:         0,
  timezone:           '+00:00',     // store timestamps as UTC
  decimalNumbers:     false,        // keep DECIMAL as strings for precision
});

/**
 * Run a single parameterised query on the pool.
 * Usage: const [rows] = await db.query('SELECT * FROM vehicles WHERE id = ?', [id]);
 */
async function query(sql, params) {
  const [rows] = await pool.execute(sql, params || []);
  return rows;
}

/**
 * Acquire a connection for multi-statement transactions.
 * Usage:
 *   const conn = await db.getConnection();
 *   await conn.beginTransaction();
 *   try { ... await conn.execute(...); await conn.commit(); }
 *   catch (e) { await conn.rollback(); throw e; }
 *   finally { conn.release(); }
 */
async function getConnection() {
  return pool.getConnection();
}

module.exports = { query, getConnection };

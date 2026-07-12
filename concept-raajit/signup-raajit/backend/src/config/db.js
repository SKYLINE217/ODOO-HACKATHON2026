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
  timezone:           '+00:00',
  decimalNumbers:     false,
});

/**
 * Run a single parameterised query on the pool.
 * Usage: const rows = await db.query('SELECT * FROM users WHERE id = ?', [id]);
 */
async function query(sql, params) {
  const [rows] = await pool.execute(sql, params || []);
  return rows;
}

/**
 * Acquire a connection for multi-statement transactions.
 */
async function getConnection() {
  return pool.getConnection();
}

module.exports = { query, getConnection, pool };

/**
 * Server entry point.
 * Starts Express and verifies DB connection.
 */

const app = require('./app');
const config = require('./config/env');
const pool = require('./config/db');

async function start() {
  // ── SECURITY: Fail fast if critical secrets are missing ──
  if (!config.jwt.secret) {
    console.error('[FATAL] JWT_SECRET is not set in .env. Refusing to start — tokens would be forgeable.');
    process.exit(1);
  }

  // Verify DB connection on startup
  try {
    const connection = await pool.getConnection();
    console.log(`[DB] Connected to MySQL: ${config.db.name}@${config.db.host}:${config.db.port}`);
    connection.release();
  } catch (err) {
    console.error('[DB] Failed to connect:', err.message);
    console.warn('[DB] Server starting anyway — DB-dependent routes will fail until connection is available.');
  }

  app.listen(config.port, () => {
    console.log(`[Server] TransitOps API running on http://localhost:${config.port}`);
    console.log(`[Server] Environment: ${config.nodeEnv}`);
    console.log(`[Server] CORS origin: ${config.corsOrigin}`);
  });
}

start();

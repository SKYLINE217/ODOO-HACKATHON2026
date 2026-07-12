'use strict';

require('dotenv').config();
const app = require('./app');
const seedDatabase = require('./src/config/seed');
const { pool } = require('./src/config/db');

const PORT = process.env.PORT || 3001;

async function startServer() {
  // Seed demo data before accepting connections (non-production only)
  if (process.env.NODE_ENV !== 'production') {
    await seedDatabase();
  }

  const server = app.listen(PORT, () => {
    console.log(`[Server] TransitOps API running on http://localhost:${PORT}`);
    console.log(`[Server] Health: http://localhost:${PORT}/health`);
    console.log(`[Server] Environment: ${process.env.NODE_ENV || 'development'}`);
  });

  // ── Graceful shutdown ──
  async function gracefulShutdown(signal) {
    console.log(`\n[Server] ${signal} received. Shutting down gracefully...`);
    server.close(async () => {
      console.log('[Server] HTTP server closed.');
      try {
        await pool.end();
        console.log('[Server] MySQL pool closed.');
      } catch (err) {
        console.error('[Server] Error closing MySQL pool:', err);
      }
      process.exit(0);
    });
    // Force exit after 10 seconds if graceful shutdown stalls
    setTimeout(() => {
      console.error('[Server] Graceful shutdown timed out. Forcing exit.');
      process.exit(1);
    }, 10000);
  }

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
}

// ── Global error handlers ──
process.on('unhandledRejection', (reason, promise) => {
  console.error('[FATAL] Unhandled Rejection:', reason);
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  console.error('[FATAL] Uncaught Exception:', err);
  process.exit(1);
});

startServer();

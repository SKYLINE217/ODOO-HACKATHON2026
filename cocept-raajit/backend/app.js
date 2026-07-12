'use strict';

require('dotenv').config();
const express  = require('express');
const cors     = require('cors');
const helmet   = require('helmet');

const { errorHandler } = require('./src/middleware/errorHandler');

// Route modules
const vehiclesRouter    = require('./src/routes/vehicles');
const driversRouter     = require('./src/routes/drivers');
const tripsRouter       = require('./src/routes/trips');
const maintenanceRouter = require('./src/routes/maintenance');
const fuelLogsRouter    = require('./src/routes/fuelLogs');
const expensesRouter    = require('./src/routes/expenses');
const dashboardRouter   = require('./src/routes/dashboard');
const reportsRouter     = require('./src/routes/reports');
// Auth routes are owned by Dev B — they will mount /api/v1/auth here
// const authRouter = require('./src/routes/auth');

const app = express();

// ── Global middleware ────────────────────────────────────────
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// ── Health check (unauthenticated) ──────────────────────────
app.get('/health', (_req, res) =>
  res.json({ success: true, data: { status: 'ok', ts: new Date().toISOString() } })
);

// ── API v1 routes ────────────────────────────────────────────
const BASE = '/api/v1';

// app.use(`${BASE}/auth`,        authRouter);        // Dev B mounts this
app.use(`${BASE}/vehicles`,    vehiclesRouter);
app.use(`${BASE}/drivers`,     driversRouter);
app.use(`${BASE}/trips`,       tripsRouter);
app.use(`${BASE}/maintenance`, maintenanceRouter);
app.use(`${BASE}/fuel-logs`,   fuelLogsRouter);
app.use(`${BASE}/expenses`,    expensesRouter);
app.use(`${BASE}/dashboard`,   dashboardRouter);
app.use(`${BASE}/reports`,     reportsRouter);

// ── 404 handler ──────────────────────────────────────────────
app.use((_req, res) =>
  res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Route not found.' } })
);

// ── Central error handler (must be last) ─────────────────────
app.use(errorHandler);

module.exports = app;

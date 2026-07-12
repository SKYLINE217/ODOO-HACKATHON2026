/**
 * Express app — central scaffold.
 *
 * SKILL-security.md §2: security middleware baked in at scaffold time, not retrofitted.
 * SKILL-backend.md §1: folder structure from backend.md §0.
 * backend.md §1: response envelope { success, data } / { success, error }.
 */

const express = require('express');
const { helmetMiddleware, corsMiddleware } = require('./middleware/security');
const { errorHandler } = require('./middleware/errorHandler');
const authRoutes = require('./routes/auth.routes');
const vehicleRoutes = require('./routes/vehicles');
const driverRoutes = require('./routes/drivers');
const tripRoutes = require('./routes/trips');
const maintenanceRoutes = require('./routes/maintenance');
const fuelRoutes = require('./routes/fuelLogs');
const expenseRoutes = require('./routes/expenses');
const dashboardRoutes = require('./routes/dashboard');
const reportRoutes = require('./routes/reports');

const app = express();

// ── Security middleware (applied FIRST — SKILL-security.md §2) ──
app.use(helmetMiddleware);
app.use(corsMiddleware);

// ── Body parsing with size limit (prevent payload floods) ──
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// ── Health check ──
app.get('/api/v1/health', (req, res) => {
  res.json({ success: true, data: { status: 'ok', timestamp: new Date().toISOString() } });
});

// ── Auth routes (Dev B — /api/v1/auth) ──
app.use('/api/v1/auth', authRoutes);

// ── Dev A Routes ──
app.use('/api/v1/vehicles', vehicleRoutes);
app.use('/api/v1/drivers', driverRoutes);
app.use('/api/v1/trips', tripRoutes);
app.use('/api/v1/maintenance', maintenanceRoutes);
app.use('/api/v1/fuel-logs', fuelRoutes);
app.use('/api/v1/expenses', expenseRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);
app.use('/api/v1/reports', reportRoutes);

// ── 404 handler ──
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: { code: 'NOT_FOUND', message: `Route ${req.method} ${req.path} not found.` },
  });
});

// ── Global error handler ──
app.use(errorHandler);

module.exports = app;

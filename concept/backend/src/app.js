/**
 * Express app — central scaffold.
 *
 * SKILL-security.md §2: security middleware baked in at scaffold time, not retrofitted.
 * SKILL-backend.md §1: folder structure from backend.md §0.
 * backend.md §1: response envelope { success, data } / { success, error }.
 */

const express = require('express');
const { helmetMiddleware, corsMiddleware } = require('./middleware/security');
const authRoutes = require('./routes/auth.routes');

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

// ── Placeholder route mounts for Dev A ──
// Uncomment and replace with real route files as endpoints are built:
// const vehicleRoutes = require('./routes/vehicle.routes');
// const driverRoutes = require('./routes/driver.routes');
// const tripRoutes = require('./routes/trip.routes');
// const maintenanceRoutes = require('./routes/maintenance.routes');
// const fuelRoutes = require('./routes/fuel.routes');
// const expenseRoutes = require('./routes/expense.routes');
// const dashboardRoutes = require('./routes/dashboard.routes');
// const reportRoutes = require('./routes/report.routes');
//
// app.use('/api/v1/vehicles', vehicleRoutes);
// app.use('/api/v1/drivers', driverRoutes);
// app.use('/api/v1/trips', tripRoutes);
// app.use('/api/v1/maintenance', maintenanceRoutes);
// app.use('/api/v1/fuel-logs', fuelRoutes);
// app.use('/api/v1/expenses', expenseRoutes);
// app.use('/api/v1/dashboard', dashboardRoutes);
// app.use('/api/v1/reports', reportRoutes);

// ── 404 handler ──
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: { code: 'NOT_FOUND', message: `Route ${req.method} ${req.path} not found.` },
  });
});

// ── Global error handler ──
app.use((err, req, res, _next) => {
  console.error('[Server] Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: { code: 'SERVER_ERROR', message: 'Internal server error.' },
  });
});

module.exports = app;

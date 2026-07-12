'use strict';

/**
 * Dashboard API routes — /api/v1/dashboard
 *
 * All routes require authentication. RBAC is enforced per-route.
 */

const { Router } = require('express');
const { requireAuth, requireRole } = require('../middleware/auth');
const ctrl = require('../controllers/dashboardController');

const router = Router();

// All routes require authentication
router.use(requireAuth);

// ── Dashboard Summary (all roles) ─────────────────────────────
router.get('/summary', ctrl.getDashboardSummary);

// ── Vehicles (Fleet Manager ✓, Dispatcher view, Financial Analyst view) ────────────────
router.get('/vehicles', requireRole(['fleet_manager', 'dispatcher', 'financial_analyst']), ctrl.getVehicles);
router.post('/vehicles', requireRole(['fleet_manager']), ctrl.createVehicle);
router.put('/vehicles/:id', requireRole(['fleet_manager']), ctrl.updateVehicle);

// ── Drivers (Fleet Manager ✓, Safety Officer ✓) ──────────────────
router.get('/drivers', requireRole(['fleet_manager', 'safety_officer']), ctrl.getDrivers);
router.post('/drivers', requireRole(['fleet_manager', 'safety_officer']), ctrl.createDriver);
router.put('/drivers/:id/status', requireRole(['fleet_manager', 'safety_officer']), ctrl.updateDriverStatus);

// ── Trips (Dispatcher ✓, Safety Officer view) ────────────────────────────
router.get('/trips', requireRole(['dispatcher', 'safety_officer']), ctrl.getTrips);
router.post('/trips', requireRole(['dispatcher']), ctrl.createTrip);
router.put('/trips/:id/status', requireRole(['dispatcher']), ctrl.updateTripStatus);

// ── Maintenance (Fleet Manager) ───────────────────────────────
router.get('/maintenance', requireRole(['fleet_manager']), ctrl.getMaintenance);
router.post('/maintenance', requireRole(['fleet_manager']), ctrl.createMaintenance);
router.put('/maintenance/:id', requireRole(['fleet_manager']), ctrl.updateMaintenance);

// ── Fuel Logs (Financial Analyst ✓) ────────────────────────
router.get('/fuel-logs', requireRole(['financial_analyst']), ctrl.getFuelLogs);
router.post('/fuel-logs', requireRole(['financial_analyst']), ctrl.createFuelLog);

// ── Expenses (Financial Analyst ✓) ──────────────
router.get('/expenses', requireRole(['financial_analyst']), ctrl.getExpenses);
router.post('/expenses', requireRole(['financial_analyst']), ctrl.createExpense);

// ── Analytics (Fleet Manager ✓, Financial Analyst ✓) ─────────────
router.get('/analytics', requireRole(['fleet_manager', 'financial_analyst']), ctrl.getAnalytics);

// ── Settings (Fleet Manager only) ─────────────────────────────
router.get('/settings', requireRole(['fleet_manager']), ctrl.getSettings);
router.put('/settings', requireRole(['fleet_manager']), ctrl.updateSettings);

// ── User Profile (all authenticated users) ────────────────────
router.get('/profile', ctrl.getUserProfile);
router.put('/profile', ctrl.updateUserProfile);
router.put('/profile/password', ctrl.changePassword);
router.delete('/profile', ctrl.deleteAccount);

// ── Export (Fleet Manager + Financial Analyst) ────────────────────
router.get('/export/:table', requireRole(['fleet_manager', 'financial_analyst']), ctrl.exportCsv);

module.exports = router;

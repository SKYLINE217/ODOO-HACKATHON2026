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

// ── Vehicles (Fleet Manager full, others view) ────────────────
router.get('/vehicles', ctrl.getVehicles);
router.post('/vehicles', requireRole(['fleet_manager']), ctrl.createVehicle);
router.put('/vehicles/:id', requireRole(['fleet_manager']), ctrl.updateVehicle);

// ── Drivers (Safety Officer + Fleet Manager) ──────────────────
router.get('/drivers', ctrl.getDrivers);
router.post('/drivers', requireRole(['fleet_manager', 'safety_officer']), ctrl.createDriver);
router.put('/drivers/:id/status', requireRole(['fleet_manager', 'safety_officer']), ctrl.updateDriverStatus);

// ── Trips (Driver + Fleet Manager) ────────────────────────────
router.get('/trips', ctrl.getTrips);
router.post('/trips', requireRole(['fleet_manager', 'driver']), ctrl.createTrip);
router.put('/trips/:id/status', requireRole(['fleet_manager', 'driver']), ctrl.updateTripStatus);

// ── Maintenance (Fleet Manager) ───────────────────────────────
router.get('/maintenance', ctrl.getMaintenance);
router.post('/maintenance', requireRole(['fleet_manager']), ctrl.createMaintenance);
router.put('/maintenance/:id', requireRole(['fleet_manager']), ctrl.updateMaintenance);

// ── Fuel Logs (Driver + Fleet Manager) ────────────────────────
router.get('/fuel-logs', ctrl.getFuelLogs);
router.post('/fuel-logs', requireRole(['fleet_manager', 'driver']), ctrl.createFuelLog);

// ── Expenses (Financial Analyst + Fleet Manager) ──────────────
router.get('/expenses', ctrl.getExpenses);
router.post('/expenses', requireRole(['fleet_manager', 'financial_analyst']), ctrl.createExpense);

// ── Analytics (Financial Analyst + Fleet Manager) ─────────────
router.get('/analytics', ctrl.getAnalytics);

// ── Settings (Fleet Manager only) ─────────────────────────────
router.get('/settings', ctrl.getSettings);
router.put('/settings', requireRole(['fleet_manager']), ctrl.updateSettings);

// ── User Profile (all authenticated users) ────────────────────
router.get('/profile', ctrl.getUserProfile);
router.put('/profile', ctrl.updateUserProfile);
router.put('/profile/password', ctrl.changePassword);

module.exports = router;

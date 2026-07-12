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
router.get('/maintenance', requireRole(['fleet_manager']), ctrl.getMaintenance);
router.post('/maintenance', requireRole(['fleet_manager']), ctrl.createMaintenance);
router.put('/maintenance/:id', requireRole(['fleet_manager']), ctrl.updateMaintenance);

// ── Fuel Logs (Driver + Fleet Manager + Financial Analyst) ────────────────────────
router.get('/fuel-logs', requireRole(['fleet_manager', 'financial_analyst', 'driver']), ctrl.getFuelLogs);
router.post('/fuel-logs', requireRole(['fleet_manager', 'driver']), ctrl.createFuelLog);

// ── Expenses (Financial Analyst + Fleet Manager) ──────────────
router.get('/expenses', requireRole(['fleet_manager', 'financial_analyst', 'driver']), ctrl.getExpenses);
router.post('/expenses', requireRole(['fleet_manager', 'financial_analyst']), ctrl.createExpense);

// ── Analytics (Financial Analyst + Fleet Manager + Safety Officer) ─────────────
router.get('/analytics', requireRole(['fleet_manager', 'financial_analyst', 'safety_officer']), ctrl.getAnalytics);

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

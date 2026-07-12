'use strict';

const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/reportsController');
const { requireAuth, requireRole } = require('../middleware/auth');

router.use(requireAuth);

// Fuel efficiency
router.get('/fuel-efficiency',
  requireRole(['fleet_manager', 'financial_analyst', 'safety_officer']),
  ctrl.fuelEfficiency
);

// Fleet utilization
router.get('/utilization',
  requireRole(['fleet_manager', 'financial_analyst', 'safety_officer']),
  ctrl.utilization
);

// Operational cost per vehicle
router.get('/operational-cost',
  requireRole(['fleet_manager', 'financial_analyst', 'safety_officer']),
  ctrl.operationalCost
);

// ROI per vehicle
router.get('/roi',
  requireRole(['fleet_manager', 'financial_analyst', 'safety_officer']),
  ctrl.roi
);

// CSV export
// Usage: GET /api/v1/reports/export.csv?report=fuel-efficiency|utilization|operational-cost|roi
router.get('/export.csv',
  requireRole(['fleet_manager', 'financial_analyst']),
  ctrl.exportCsv
);

module.exports = router;

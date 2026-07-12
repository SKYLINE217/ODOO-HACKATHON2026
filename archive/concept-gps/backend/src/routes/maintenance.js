'use strict';

const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/maintenanceController');
const { requireAuth, requireRole } = require('../middleware/auth');

router.use(requireAuth);

router.get('/',
  requireRole(['fleet_manager', 'financial_analyst']),
  ctrl.list
);

router.post('/',
  requireRole(['fleet_manager']),
  ctrl.create
);

router.post('/:id/close',
  requireRole(['fleet_manager']),
  ctrl.close
);

module.exports = router;

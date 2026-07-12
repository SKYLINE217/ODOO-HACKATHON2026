'use strict';

const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/fuelLogsController');
const { requireAuth, requireRole } = require('../middleware/auth');

router.use(requireAuth);

router.get('/',
  requireRole(['fleet_manager', 'financial_analyst']),
  ctrl.list
);

router.post('/',
  requireRole(['fleet_manager', 'driver']),
  ctrl.create
);

module.exports = router;

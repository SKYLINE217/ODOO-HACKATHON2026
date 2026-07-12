'use strict';

const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/expensesController');
const { requireAuth, requireRole } = require('../middleware/auth');

router.use(requireAuth);

router.get('/',
  requireRole(['financial_analyst', 'fleet_manager']),
  ctrl.list
);

router.post('/',
  requireRole(['fleet_manager', 'financial_analyst']),
  ctrl.create
);

module.exports = router;

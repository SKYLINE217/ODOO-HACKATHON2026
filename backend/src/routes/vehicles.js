'use strict';

const express  = require('express');
const router   = express.Router();
const ctrl     = require('../controllers/vehiclesController');
const { requireAuth, requireRole } = require('../middleware/auth');

// All routes require authentication
router.use(requireAuth);

// GET /api/v1/vehicles/dispatch-pool  — must be BEFORE /:id to avoid param collision
router.get('/dispatch-pool',
  requireRole(['fleet_manager', 'driver']),
  ctrl.getDispatchPool
);

router.get('/',     ctrl.list);
router.get('/:id',  ctrl.getById);

router.post('/',
  requireRole(['fleet_manager']),
  ctrl.create
);

router.put('/:id',
  requireRole(['fleet_manager']),
  ctrl.update
);

router.patch('/:id/status',
  requireRole(['fleet_manager']),
  ctrl.patchStatus
);

module.exports = router;

'use strict';

const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/driversController');
const { requireAuth, requireRole } = require('../middleware/auth');

router.use(requireAuth);

// dispatch-pool BEFORE /:id
router.get('/dispatch-pool',
  requireRole(['fleet_manager', 'driver']),
  ctrl.getDispatchPool
);

router.get('/',    ctrl.list);
router.get('/:id', ctrl.getById);

router.post('/',
  requireRole(['fleet_manager', 'safety_officer']),
  ctrl.create
);

router.put('/:id',
  requireRole(['fleet_manager', 'safety_officer']),
  ctrl.update
);

router.patch('/:id/status',
  requireRole(['safety_officer']),
  ctrl.patchStatus
);

module.exports = router;

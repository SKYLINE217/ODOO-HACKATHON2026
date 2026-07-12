'use strict';

const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/tripsController');
const { requireAuth, requireRole } = require('../middleware/auth');

router.use(requireAuth);

router.get('/',    ctrl.list);
router.get('/:id', ctrl.getById);

router.post('/',
  requireRole(['driver', 'fleet_manager']),
  ctrl.create
);

router.post('/:id/dispatch',
  requireRole(['driver', 'fleet_manager']),
  ctrl.dispatch
);

router.post('/:id/complete',
  requireRole(['driver', 'fleet_manager']),
  ctrl.complete
);

router.post('/:id/cancel',
  requireRole(['driver', 'fleet_manager']),
  ctrl.cancel
);

module.exports = router;

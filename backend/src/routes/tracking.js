'use strict';
const express = require('express');
const router = express.Router();
const trackingController = require('../controllers/trackingController');
const { requireAuth, requireRole } = require('../middleware/auth');

// Drivers and Fleet Managers can update locations
router.post('/', requireAuth, requireRole(['fleet_manager', 'driver']), trackingController.updateLocation);

// SSE endpoint for push-based map updates
router.get('/stream', requireAuth, requireRole(['fleet_manager']), trackingController.streamLocations);

// Only Fleet Managers can view the entire live map (initial fetch)
router.get('/active', requireAuth, requireRole(['fleet_manager']), trackingController.getActiveLocations);

module.exports = router;

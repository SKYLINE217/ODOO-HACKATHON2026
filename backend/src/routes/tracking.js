'use strict';
const express = require('express');
const router = express.Router();
const trackingController = require('../controllers/trackingController');
const { requireAuth, requireRole } = require('../middleware/auth');

// Drivers and Fleet Managers can update locations
router.post('/', requireAuth, requireRole(['fleet_manager', 'driver']), trackingController.updateLocation);

// Only Fleet Managers can view the entire live map
router.get('/active', requireAuth, requireRole(['fleet_manager']), trackingController.getActiveLocations);

module.exports = router;

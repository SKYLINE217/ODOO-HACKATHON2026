const express = require('express');
const router = express.Router();
const trackingController = require('../controllers/trackingController');
// Assuming we would add auth middleware here later, e.g., requireAuth
// const { requireAuth, requireRole } = require('../middleware/auth');

// POST /api/tracking - Update a vehicle's location
router.post('/', trackingController.updateLocation);

// GET /api/tracking/active - Get all active vehicle locations (for manager map)
router.get('/active', trackingController.getActiveLocations);

module.exports = router;

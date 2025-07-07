// In your routes file (backend/routes/waterRoutes.js)

const express = require('express');
const router = express.Router();
const waterController = require('../controllers/waterController');
// Replace this line
// const { authenticateToken } = require('../middleware/auth');
// with the correct middleware import
const authenticateToken = require('../middleware/authenticateToken');

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Water progress and logs
router.get('/progress', waterController.getWaterProgress);
router.get('/logs/detailed', waterController.getDetailedWaterLogs);
router.post('/logs', waterController.logWater);

// Water goal
router.get('/goal', waterController.getWaterGoal);
router.put('/goal', waterController.updateWaterGoal);

module.exports = router;
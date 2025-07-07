// backend/routes/meditationRoutes.js
const express = require('express');
const meditationController = require('../controllers/meditationController');
const authenticateToken = require('../middleware/authenticateToken');
const isAdmin = require('../middleware/isAdmin');

const router = express.Router();

// Protected routes - require authentication
router.get('/meditations', authenticateToken, meditationController.getMeditations);

// Admin Only Routes
router.post('/', authenticateToken, isAdmin, meditationController.createMeditation);
router.put('/:meditationId', authenticateToken, isAdmin, meditationController.updateExistingMeditation);
router.delete('/:meditationId', authenticateToken, isAdmin, meditationController.removeMeditation);

module.exports = router;
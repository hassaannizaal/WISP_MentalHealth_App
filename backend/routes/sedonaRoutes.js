// backend/routes/sedonaRoutes.js
const express = require('express');
const router = express.Router();
const sedonaController = require('../controllers/sedonaController');
const authenticateToken = require('../middleware/authenticateToken');

// Protected routes - require authentication
router.get('/sedona-exercises', authenticateToken, sedonaController.getSedonaExercises);
router.post('/logs', authenticateToken, sedonaController.createSedonaLog);
router.get('/logs', authenticateToken, sedonaController.listUserSedonaLogs);

module.exports = router;
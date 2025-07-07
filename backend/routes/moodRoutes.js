const express = require('express');
const moodController = require('../controllers/moodController');
const authenticateToken = require('../middleware/authenticateToken');

const router = express.Router();

// Apply authentication middleware to all mood routes
router.use(authenticateToken);

// POST /api/moods - Log a new mood entry for the authenticated user
router.post('/', moodController.addMoodLog);

// GET /api/moods - Get mood entries for the authenticated user (optional date filtering)
router.get('/', moodController.getUserMoods);

// GET /api/moods/summary - Get an overall mood summary (admin protected or general)
// For now, let's assume it needs authentication but not necessarily admin for broad stats
router.get('/summary', moodController.getMoodSummary);

module.exports = router; 
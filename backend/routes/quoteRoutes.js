const express = require('express');
const router = express.Router();
const quoteController = require('../controllers/quoteController');
const authenticateToken = require('../middleware/authenticateToken');

// Apply authentication middleware
router.use(authenticateToken);

// GET /api/quotes - Get daily quote
router.get('/', quoteController.getDailyQuote);

module.exports = router;
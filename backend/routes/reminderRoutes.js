const express = require('express');
const router = express.Router();
const reminderController = require('../controllers/reminderController');
const authenticateToken = require('../middleware/authenticateToken');

// Apply authentication middleware to all routes
router.use(authenticateToken);

// GET all reminders
router.get('/', reminderController.getReminders);

// Create new reminder
router.post('/', reminderController.createReminder);

// Update reminder
router.patch('/:type/:id', reminderController.updateReminder);

// Delete reminder
router.delete('/:type/:id', reminderController.deleteReminder);

module.exports = router;
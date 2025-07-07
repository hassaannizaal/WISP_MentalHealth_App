// backend/routes/journalRoutes.js
const express = require('express');
const router = express.Router();
const journalController = require('../controllers/journalController');
const authenticateToken = require('../middleware/authenticateToken');

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Journal entries routes
router.get('/entries', journalController.getJournalEntries);
router.post('/entries', journalController.createJournalEntry);
router.get('/entries/:id', journalController.getJournalEntryById);
router.put('/entries/:id', journalController.updateJournalEntry);
router.delete('/entries/:id', journalController.deleteJournalEntry);
router.post('/entries/:id/unlock', journalController.unlockJournalEntry);

// Categories routes
router.get('/categories', journalController.getJournalCategories);

module.exports = router;
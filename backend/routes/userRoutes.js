const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authenticateToken = require('../middleware/authenticateToken');
const isAdmin = require('../middleware/isAdmin');

// Apply authentication middleware to all routes
router.use(authenticateToken);

// User profile routes
router.get('/me', userController.getCurrentUserProfile);
router.put('/me', userController.updateCurrentUserProfile);

// Journal password routes
router.put('/me/journal-password', userController.setJournalPassword);
router.post('/me/journal-password/verify', userController.verifyJournalPassword);
router.post('/me/journal-password/remove', userController.removeJournalPassword);

// Admin routes
router.get('/list', isAdmin, userController.listAllUsers);
router.delete('/:userId', isAdmin, userController.removeUser);

// Role management routes
router.post('/:userId/roles', isAdmin, userController.assignRole);
router.delete('/:userId/roles', isAdmin, userController.removeRole);
router.get('/:userId/roles', userController.getUserRoles);

// Ban/Unban user route
router.put('/:userId/ban-status', isAdmin, userController.toggleUserBanStatus);

module.exports = router;
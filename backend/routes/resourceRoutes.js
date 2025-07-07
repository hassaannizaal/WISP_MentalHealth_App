// backend/routes/resourceRoutes.js
const express = require('express');
const resourceController = require('../controllers/resourceController');
const authenticateToken = require('../middleware/authenticateToken');
const isAdmin = require('../middleware/isAdmin');

const router = express.Router();

// GET /api/resources - All users can view resources
router.get('/', authenticateToken, resourceController.listAllResources);

// Admin Only Routes (POST, PUT, DELETE require admin privileges)
router.post('/', authenticateToken, isAdmin, resourceController.createResource);
router.put('/:resourceId', authenticateToken, isAdmin, resourceController.updateExistingResource);
router.delete('/:resourceId', authenticateToken, isAdmin, resourceController.removeResource);

module.exports = router; 
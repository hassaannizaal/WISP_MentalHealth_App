// backend/routes/musicRoutes.js
const express = require('express');
const musicController = require('../controllers/musicController');
const authenticateToken = require('../middleware/authenticateToken');

const router = express.Router();

// GET /api/music/playlist - Get the static playlist (requires auth just to access)
router.get('/playlist', authenticateToken, musicController.getMusicPlaylist);

// GET /api/music/playlists - Get all playlists (alias for playlist endpoint)
router.get('/playlists', authenticateToken, musicController.getMusicPlaylists);

module.exports = router; 
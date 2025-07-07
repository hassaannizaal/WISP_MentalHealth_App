const express = require('express');
const router = express.Router();
const communityController = require('../controllers/communityController');
const authenticateToken = require('../middleware/authenticateToken');
const isAdmin = require('../middleware/isAdmin');

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Topic routes
router.get('/topics', communityController.getTopics);
router.get('/topics/:topicId', communityController.getTopicById);
router.get('/topic-thread-counts', communityController.getTopicThreadCounts);

// Thread routes
router.post('/topics/:topicId/threads', communityController.createThread);
router.get('/topics/:topicId/threads', communityController.getThreadsByTopic);
router.get('/threads/:threadId', communityController.getThreadById);
router.patch('/threads/:threadId', communityController.updateThread);
router.delete('/threads/:threadId', communityController.deleteThread);

// Comment routes
router.post('/threads/:threadId/comments', communityController.createComment);
router.get('/threads/:threadId/comments', communityController.getCommentsByThread);
router.patch('/comments/:commentId', communityController.updateComment);
router.delete('/comments/:commentId', communityController.deleteComment);

// Like routes
router.post('/threads/:threadId/like', communityController.toggleThreadLike);
router.post('/comments/:commentId/like', communityController.toggleCommentLike);

// Category routes
router.get('/categories', communityController.getCategories);
router.post('/threads/:threadId/categories', communityController.addThreadCategories);

// Report routes
router.post('/reports', communityController.reportContent);
router.get('/reports', isAdmin, communityController.getContentReports);
router.patch('/reports/:reportId', isAdmin, communityController.resolveReport);

// User profile routes
router.get('/users/:userId/profile', communityController.getUserProfile);

// Search routes
router.get('/search', communityController.searchContent);

module.exports = router;
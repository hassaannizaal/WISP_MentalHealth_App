const communityQueries = require('../queries/communityQueries');

// Topic Controllers
const getTopics = async (req, res) => {
    try {
        const topics = await communityQueries.getAllTopics();
        res.json(topics);
    } catch (error) {
        console.error('Error fetching topics:', error);
        res.status(500).json({ message: 'Failed to fetch topics' });
    }
};

const getTopicById = async (req, res) => {
    try {
        const topic = await communityQueries.getTopicById(req.params.topicId);
        if (!topic) {
            return res.status(404).json({ message: 'Topic not found' });
        }
        res.json(topic);
    } catch (error) {
        console.error('Error fetching topic:', error);
        res.status(500).json({ message: 'Failed to fetch topic' });
    }
};

// Thread Controllers
const createThread = async (req, res) => {
    const { title, content } = req.body;
    const topicId = parseInt(req.params.topicId);
    const userId = req.user.id;

    // Input validation
    if (!title || typeof title !== 'string' || title.trim().length === 0) {
        return res.status(400).json({ 
            message: 'Invalid title',
            details: 'Title must be a non-empty string'
        });
    }

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
        return res.status(400).json({ 
            message: 'Invalid content',
            details: 'Content must be a non-empty string'
        });
    }

    if (!topicId || isNaN(topicId)) {
        return res.status(400).json({ 
            message: 'Invalid topic ID',
            details: 'Topic ID must be a valid number'
        });
    }

    try {
        // Verify topic exists
        const topic = await communityQueries.getTopicById(topicId);
        if (!topic) {
            return res.status(404).json({ 
                message: 'Topic not found',
                details: `No topic exists with ID ${topicId}`
            });
        }

        const thread = await communityQueries.createThread(userId, topicId, title, content);
        res.status(201).json({
            message: 'Thread created successfully',
            thread
        });
    } catch (error) {
        console.error('Error creating thread:', error);
        if (error.message === 'Invalid user ID' || error.message === 'Invalid topic ID') {
            return res.status(400).json({ message: error.message });
        }
        res.status(500).json({ message: 'Failed to create thread' });
    }
};

const getThreadsByTopic = async (req, res) => {
    const { topicId } = req.params;
    const userId = req.user.id;
    try {
      const threads = await communityQueries.getThreadsByTopic(topicId, userId);
      res.json(threads);
    } catch (error) {
      console.error('Error getting threads:', error);
      res.status(500).json({ message: 'Failed to load threads' });
    }
  };

const getThreadById = async (req, res) => {
    const { threadId } = req.params;
    const userId = req.user.id;

    try {
        const thread = await communityQueries.getThreadById(threadId, userId);
        if (!thread) {
            return res.status(404).json({ message: 'Thread not found' });
        }
        res.json(thread);
    } catch (error) {
        console.error('Error fetching thread:', error);
        res.status(500).json({ message: 'Failed to fetch thread' });
    }
};

// Thread Management Controllers
const deleteThread = async (req, res) => {
    const { threadId } = req.params;
    const userId = req.user.id;

    try {
        // Check if user is admin
        const isAdmin = await communityQueries.isUserAdmin(userId);
        if (!isAdmin) {
            return res.status(403).json({ message: 'Only administrators can delete threads' });
        }

        // Delete the thread
        await communityQueries.deleteThread(threadId);
        res.json({ message: 'Thread deleted successfully' });
    } catch (error) {
        console.error('Error deleting thread:', error);
        res.status(500).json({ message: 'Failed to delete thread' });
    }
};

const updateThread = async (req, res) => {
    const { threadId } = req.params;
    const { title, content, reason } = req.body;
    const userId = req.user.id;

    try {
        const thread = await communityQueries.getThreadById(threadId, userId);
        if (!thread) {
            return res.status(404).json({ message: 'Thread not found' });
        }

        // Check if user is thread owner or moderator
        const isModerator = await communityQueries.isUserModerator(userId);
        if (thread.user_id !== userId && !isModerator) {
            return res.status(403).json({ message: 'Permission denied' });
        }

        const updatedThread = await communityQueries.editThread(
            threadId,
            userId,
            title || thread.title,
            content || thread.content,
            reason
        );

        res.json({
            message: 'Thread updated successfully',
            thread: updatedThread
        });
    } catch (error) {
        console.error('Error updating thread:', error);
        res.status(500).json({ message: 'Failed to update thread' });
    }
};

// Comment Controllers
const createComment = async (req, res) => {
    const { threadId } = req.params;
    const { content, parentCommentId } = req.body;
    const userId = req.user.id;

    if (!content) {
        return res.status(400).json({ message: 'Comment content is required' });
    }

    try {
        // Check if thread exists
        const thread = await communityQueries.getThreadById(threadId, userId);
        if (!thread) {
            return res.status(404).json({ message: 'Thread not found' });
        }

        const comment = await communityQueries.createComment(userId, threadId, content, parentCommentId);
        res.status(201).json(comment);
    } catch (error) {
        console.error('Error creating comment:', error);
        res.status(500).json({ message: 'Failed to create comment' });
    }
};

const getCommentsByThread = async (req, res) => {
    const { threadId } = req.params;
    const userId = req.user.id;

    try {
        const comments = await communityQueries.getCommentsByThread(threadId, userId);
        res.json(comments);
    } catch (error) {
        console.error('Error fetching comments:', error);
        res.status(500).json({ message: 'Failed to fetch comments' });
    }
};

const updateComment = async (req, res) => {
    const { commentId } = req.params;
    const { content, reason } = req.body;
    const userId = req.user.id;

    if (!content) {
        return res.status(400).json({ message: 'Content is required' });
    }

    try {
        const comment = await communityQueries.getCommentById(commentId);
        if (!comment) {
            return res.status(404).json({ message: 'Comment not found' });
        }

        const isModerator = await communityQueries.isUserModerator(userId);
        if (comment.user_id !== userId && !isModerator) {
            return res.status(403).json({ message: 'Permission denied' });
        }

        const updatedComment = await communityQueries.editComment(
            commentId,
            userId,
            content,
            reason
        );

        res.json({
            message: 'Comment updated successfully',
            comment: updatedComment
        });
    } catch (error) {
        console.error('Error updating comment:', error);
        res.status(500).json({ message: 'Failed to update comment' });
    }
};

const deleteComment = async (req, res) => {
    const { commentId } = req.params;
    const userId = req.user.id;

    try {
        const comment = await communityQueries.getCommentById(commentId);
        if (!comment) {
            return res.status(404).json({ message: 'Comment not found' });
        }

        const isModerator = await communityQueries.isUserModerator(userId);
        if (comment.user_id !== userId && !isModerator) {
            return res.status(403).json({ message: 'Permission denied' });
        }

        const deletedComment = await communityQueries.softDeleteComment(commentId, userId);
        res.json({
            message: 'Comment deleted successfully',
            comment: deletedComment
        });
    } catch (error) {
        console.error('Error deleting comment:', error);
        res.status(500).json({ message: 'Failed to delete comment' });
    }
};

// Like Controllers
const toggleThreadLike = async (req, res) => {
    const { threadId } = req.params;
    const userId = req.user.id;

    try {
        const result = await communityQueries.toggleThreadLike(userId, threadId);
        res.json(result);
    } catch (error) {
        console.error('Error toggling thread like:', error);
        res.status(500).json({ message: 'Failed to toggle like' });
    }
};

const toggleCommentLike = async (req, res) => {
    const { commentId } = req.params;
    const userId = req.user.id;

    try {
        const result = await communityQueries.toggleCommentLike(userId, commentId);
        res.json(result);
    } catch (error) {
        console.error('Error toggling comment like:', error);
        res.status(500).json({ message: 'Failed to toggle like' });
    }
};

// Category Controllers
const getCategories = async (req, res) => {
    try {
        const categories = await communityQueries.getThreadCategories();
        res.json(categories);
    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({ message: 'Failed to fetch categories' });
    }
};

const addThreadCategories = async (req, res) => {
    const { threadId } = req.params;
    const { categoryIds } = req.body;

    if (!categoryIds || !Array.isArray(categoryIds)) {
        return res.status(400).json({ message: 'Category IDs array is required' });
    }

    try {
        const result = await communityQueries.addThreadCategories(threadId, categoryIds);
        res.json({
            message: 'Categories added successfully',
            categories: result
        });
    } catch (error) {
        console.error('Error adding categories:', error);
        res.status(500).json({ message: 'Failed to add categories' });
    }
};

// Report Controllers
const reportContent = async (req, res) => {
    const { threadId, commentId, reason } = req.body;
    const userId = req.user.id;

    if (!reason) {
        return res.status(400).json({ message: 'Reason is required' });
    }

    if (!threadId && !commentId) {
        return res.status(400).json({ message: 'Thread ID or Comment ID is required' });
    }

    try {
        const report = await communityQueries.createReport(userId, reason, threadId, commentId);
        res.status(201).json({
            message: 'Report submitted successfully',
            report
        });
    } catch (error) {
        console.error('Error submitting report:', error);
        res.status(500).json({ message: 'Failed to submit report' });
    }
};

const getContentReports = async (req, res) => {
    const userId = req.user.id;

    try {
        // Check if user is admin
        const isAdmin = await communityQueries.isUserAdmin(userId);
        if (!isAdmin) {
            return res.status(403).json({ message: 'Only administrators can view reports' });
        }

        // Get all reports
        const reports = await communityQueries.getReports();
        res.json(reports);
    } catch (error) {
        console.error('Error getting reports:', error);
        res.status(500).json({ message: 'Failed to get reports' });
    }
};

const resolveReport = async (req, res) => {
    const { reportId } = req.params;
    const { status } = req.body;
    const userId = req.user.id;

    if (!['resolved', 'rejected'].includes(status)) {
        return res.status(400).json({ message: 'Invalid status' });
    }

    try {
        // Check if user is admin
        const isAdmin = await communityQueries.isUserAdmin(userId);
        if (!isAdmin) {
            return res.status(403).json({ message: 'Only administrators can resolve reports' });
        }

        // Resolve the report
        await communityQueries.resolveReport(reportId, userId, status);
        res.json({ message: 'Report resolved successfully' });
    } catch (error) {
        console.error('Error resolving report:', error);
        res.status(500).json({ message: 'Failed to resolve report' });
    }
};

// User Profile Controllers
const getUserProfile = async (req, res) => {
    const { userId } = req.params;

    try {
        const [threads, comments] = await Promise.all([
            communityQueries.getUserThreads(userId),
            communityQueries.getUserComments(userId)
        ]);

        res.json({
            threads,
            comments,
            stats: {
                threadCount: threads.length,
                commentCount: comments.length,
                totalLikes: threads.reduce((sum, t) => sum + parseInt(t.like_count), 0) +
                           comments.reduce((sum, c) => sum + parseInt(c.like_count), 0)
            }
        });
    } catch (error) {
        console.error('Error fetching user profile:', error);
        res.status(500).json({ message: 'Failed to fetch user profile' });
    }
};

// Search Controllers
const searchContent = async (req, res) => {
    const { query } = req.query;

    if (!query || query.trim().length < 3) {
        return res.status(400).json({ 
            message: 'Search query must be at least 3 characters long' 
        });
    }

    try {
        const results = await communityQueries.searchThreads(query.trim());
        res.json(results);
    } catch (error) {
        console.error('Error searching content:', error);
        res.status(500).json({ message: 'Failed to search content' });
    }
};

const getTopicThreadCounts = async (req, res) => {
    try {
        const counts = await communityQueries.getTopicThreadCounts();
        res.json(counts);
    } catch (error) {
        console.error('Error fetching topic thread counts:', error);
        res.status(500).json({ message: 'Failed to fetch topic thread counts' });
    }
};

// Get all threads for a specific topic
const getThreadsForTopic = async (req, res) => {
    const { topicId } = req.params;
    const userId = req.user.id; // Get current user's ID from token
    try {
        const topic = await communityQueries.getTopicById(topicId);
        if (!topic) {
            return res.status(404).json({ message: 'Topic not found' });
        }
        const threads = await communityQueries.getThreadsByTopic(topicId, userId);
        res.status(200).json(threads);
    } catch (error) {
        console.error('Error in getThreadsForTopic controller:', error);
        res.status(500).json({ message: 'Error fetching threads for topic' });
    }
};

module.exports = {
    // Topic Controllers
    getTopics,
    getTopicById,
    
    // Thread Controllers
    createThread,
    getThreadsByTopic,
    getThreadById,
    updateThread,
    deleteThread,
    
    // Comment Controllers
    createComment,
    getCommentsByThread,
    updateComment,
    deleteComment,
    
    // Like Controllers
    toggleThreadLike,
    toggleCommentLike,
    
    // Category Controllers
    getCategories,
    addThreadCategories,
    
    // Report Controllers
    reportContent,
    getContentReports,
    resolveReport,
    
    // User Profile Controllers
    getUserProfile,
    
    // Search Controllers
    searchContent,
    getTopicThreadCounts,
    
    // Get all threads for a specific topic
    getThreadsForTopic,
};
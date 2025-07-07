const db = require('../db');

// Topic queries
const getAllTopics = async () => {
    const query = 'SELECT * FROM topics ORDER BY name';
    const result = await db.query(query);
    return result.rows;
};

const getTopicById = async (topicId) => {
    const query = 'SELECT * FROM topics WHERE topic_id = $1';
    const result = await db.query(query, [topicId]);
    return result.rows[0];
};

// Thread queries
const createThread = async (userId, topicId, title, content) => {
    const query = `
        INSERT INTO threads (
            user_id, 
            topic_id, 
            title, 
            content
        )
        VALUES ($1, $2, $3, $4)
        RETURNING 
            thread_id,
            user_id,
            topic_id,
            title,
            content,
            created_at,
            updated_at`;
    try {
        const result = await db.query(query, [
            userId, 
            topicId, 
            title.trim(), 
            content.trim()
        ]);
        return result.rows[0];
    } catch (error) {
        console.error('Error in createThread query:', error);
        if (error.constraint === 'threads_user_id_fkey') {
            throw new Error('Invalid user ID');
        } else if (error.constraint === 'threads_topic_id_fkey') {
            throw new Error('Invalid topic ID');
        }
        throw error;
    }
};

const getThreadsByTopic = async (topicId, userId) => {
    const query = `
        SELECT 
            t.*,
            u.username AS author_name,
            (SELECT COUNT(*) FROM comments c WHERE c.thread_id = t.thread_id AND c.deleted_at IS NULL) AS comments_count,
            (SELECT COUNT(*) FROM thread_likes tl WHERE tl.thread_id = t.thread_id) AS like_count,
            EXISTS(SELECT 1 FROM thread_likes tl WHERE tl.thread_id = t.thread_id AND tl.user_id = $2) AS user_liked
        FROM 
            threads t
        LEFT JOIN 
            users u ON t.user_id = u.user_id
        WHERE 
            t.topic_id = $1 AND t.deleted_at IS NULL
        ORDER BY 
            t.is_pinned DESC, t.created_at DESC;`;
    const result = await db.query(query, [topicId, userId]);
    return result.rows;
};

const getThreadById = async (threadId, userId) => {
    const query = `
        SELECT
            t.*,
            u.username AS author_name,
            (SELECT COUNT(*) FROM comments c WHERE c.thread_id = t.thread_id AND c.deleted_at IS NULL) AS comments_count,
            (SELECT COUNT(*) FROM thread_likes tl WHERE tl.thread_id = t.thread_id) AS like_count,
            EXISTS(SELECT 1 FROM thread_likes WHERE thread_id = t.thread_id AND user_id = $1) AS user_liked
        FROM
            threads t
        LEFT JOIN
            users u ON t.user_id = u.user_id
        WHERE
            t.thread_id = $2 AND t.deleted_at IS NULL;
    `;
    const result = await db.query(query, [userId, threadId]);
    return result.rows[0];
};

// Comment queries
const createComment = async (userId, threadId, content, parentCommentId = null) => {
    const query = `
        INSERT INTO comments (user_id, thread_id, content, parent_comment_id)
        VALUES ($1, $2, $3, $4)
        RETURNING *`;
    const result = await db.query(query, [userId, threadId, content, parentCommentId]);
    return result.rows[0];
};

const getCommentsByThread = async (threadId, userId) => {
    const query = `
        SELECT 
            c.comment_id,
            c.thread_id,
            c.user_id,
            c.parent_comment_id,
            c.content,
            c.created_at,
            c.updated_at,
            c.deleted_at, 
            c.deleted_by,
            u.username,
            COUNT(DISTINCT cl.like_id) AS like_count,
            EXISTS(SELECT 1 FROM comment_likes WHERE comment_id = c.comment_id AND user_id = $1) AS user_liked
        FROM 
            comments c
        LEFT JOIN 
            users u ON c.user_id = u.user_id
        LEFT JOIN 
            comment_likes cl ON c.comment_id = cl.comment_id
        WHERE 
            c.thread_id = $2 AND c.deleted_at IS NULL
        GROUP BY 
            c.comment_id, 
            u.username      
        ORDER BY 
            c.created_at ASC; 
    `;
    // Parameters: $1 = userId (for user_liked), $2 = threadId
    const result = await db.query(query, [userId, threadId]);
    return result.rows;
};

const getCommentById = async (commentId) => {    const query = `
        SELECT 
            c.*,
            u.username
        FROM comments c
        LEFT JOIN users u ON c.user_id = u.user_id
        WHERE c.comment_id = $1 AND c.deleted_at IS NULL
    `;
    const result = await db.query(query, [commentId]);
    return result.rows[0];
};

const softDeleteComment = async (commentId, userId) => {
    const query = `
        UPDATE comments
        SET 
            deleted_by = $2,
            deleted_at = NOW()
        WHERE comment_id = $1
        RETURNING *
    `;
    const result = await db.query(query, [commentId, userId]);
    return result.rows[0];
};

// Like queries
const toggleThreadLike = async (userId, threadId) => {
    const client = await db.pool.connect();
    try {
        await client.query('BEGIN');
        const checkQuery = 'SELECT like_id FROM thread_likes WHERE user_id = $1 AND thread_id = $2';
        const checkResult = await client.query(checkQuery, [userId, threadId]);
        
        let liked;
        if (checkResult.rows.length > 0) {
            // User has liked, so unlike
            const likeId = checkResult.rows[0].like_id;
            await client.query('DELETE FROM thread_likes WHERE like_id = $1', [likeId]);
            liked = false; // Unliked
        } else {
            // User has not liked, so like
            await client.query('INSERT INTO thread_likes (user_id, thread_id) VALUES ($1, $2)', [userId, threadId]);
            liked = true; // Liked
        }

        // Get updated like count
        const countQuery = 'SELECT COUNT(*) AS like_count FROM thread_likes WHERE thread_id = $1';
        const countResult = await client.query(countQuery, [threadId]);
        const likeCount = parseInt(countResult.rows[0].like_count, 10);

        await client.query('COMMIT');
        return { liked, like_count: likeCount };
    } catch (error) {
        await client.query('ROLLBACK');
        console.error("Error in toggleThreadLike query:", error);
        throw error;
    } finally {
        client.release();
    }
};

const toggleCommentLike = async (userId, commentId) => {
    const client = await db.pool.connect();
    try {
        await client.query('BEGIN');
        const checkQuery = 'SELECT like_id FROM comment_likes WHERE user_id = $1 AND comment_id = $2';
        const checkResult = await client.query(checkQuery, [userId, commentId]);
        
        let liked;
        if (checkResult.rows.length > 0) {
            // User has liked, so unlike
            const likeId = checkResult.rows[0].like_id;
            await client.query('DELETE FROM comment_likes WHERE like_id = $1', [likeId]);
            liked = false; // Unliked
        } else {
            // User has not liked, so like
            await client.query('INSERT INTO comment_likes (user_id, comment_id) VALUES ($1, $2)', [userId, commentId]);
            liked = true; // Liked
        }

        // Get updated like count
        const countQuery = 'SELECT COUNT(*) AS like_count FROM comment_likes WHERE comment_id = $1';
        const countResult = await client.query(countQuery, [commentId]);
        const likeCount = parseInt(countResult.rows[0].like_count, 10);

        await client.query('COMMIT');
        return { liked, like_count: likeCount };
    } catch (error) {
        await client.query('ROLLBACK');
        console.error("Error in toggleCommentLike query:", error);
        throw error;
    } finally {
        client.release();
    }
};

// Thread management queries
const deleteThread = async (threadId, userId) => {
    const query = `
        UPDATE threads 
        SET deleted_at = CURRENT_TIMESTAMP,
            deleted_by = $2
        WHERE thread_id = $1 
        RETURNING *`;
    const result = await db.query(query, [threadId, userId]);
    return result.rows[0];
};

// Role queries
const getUserRoles = async (userId) => {
    const query = `
        SELECT r.* 
        FROM user_roles r
        JOIN user_role_mappings m ON r.role_id = m.role_id
        WHERE m.user_id = $1`;
    const result = await db.query(query, [userId]);
    return result.rows;
};

const isUserModerator = async (userId) => {
    const query = `
        SELECT EXISTS (
            SELECT 1 FROM user_role_mappings m
            JOIN user_roles r ON m.role_id = r.role_id
            WHERE m.user_id = $1 AND r.name IN ('moderator', 'admin')
        ) as is_moderator`;
    const result = await db.query(query, [userId]);
    return result.rows[0].is_moderator;
};

// User role checks
const isUserAdmin = async (userId) => {
    const query = `
        SELECT EXISTS (
            SELECT 1 
            FROM user_role_mappings urm
            JOIN user_roles ur ON urm.role_id = ur.role_id
            WHERE urm.user_id = $1 AND ur.name = 'admin'
        ) as is_admin`;
    const result = await db.query(query, [userId]);
    return result.rows[0].is_admin;
};

// Thread and comment management
const softDeleteThread = async (threadId, deletedBy) => {
    const query = `
        UPDATE threads 
        SET deleted_at = CURRENT_TIMESTAMP, deleted_by = $2
        WHERE thread_id = $1 
        RETURNING *`;
    const result = await db.query(query, [threadId, deletedBy]);
    return result.rows[0];
};

const editThread = async (threadId, editorId, newTitle, newContent, reason) => {
    // Start a transaction
    const client = await db.getClient();
    try {
        await client.query('BEGIN');

        // Get current thread data
        const currentThread = await client.query(
            'SELECT title, content FROM threads WHERE thread_id = $1',
            [threadId]
        );

        // Insert edit history
        await client.query(
            `INSERT INTO thread_edits 
            (thread_id, editor_id, previous_title, previous_content, edit_reason)
            VALUES ($1, $2, $3, $4, $5)`,
            [threadId, editorId, currentThread.rows[0].title, currentThread.rows[0].content, reason]
        );

        // Update thread
        const updateQuery = `
            UPDATE threads 
            SET title = $1, content = $2, updated_at = CURRENT_TIMESTAMP
            WHERE thread_id = $3 
            RETURNING *`;
        const result = await client.query(updateQuery, [newTitle, newContent, threadId]);

        await client.query('COMMIT');
        return result.rows[0];
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};

const editComment = async (commentId, editorId, newContent, reason) => {
    const client = await db.getClient();
    try {
        await client.query('BEGIN');

        // Get current comment data
        const currentComment = await client.query(
            'SELECT content FROM comments WHERE comment_id = $1',
            [commentId]
        );

        // Insert edit history
        await client.query(
            `INSERT INTO comment_edits 
            (comment_id, editor_id, previous_content, edit_reason)
            VALUES ($1, $2, $3, $4)`,
            [commentId, editorId, currentComment.rows[0].content, reason]
        );

        // Update comment
        const updateQuery = `
            UPDATE comments 
            SET content = $1, updated_at = CURRENT_TIMESTAMP
            WHERE comment_id = $2 
            RETURNING *`;
        const result = await client.query(updateQuery, [newContent, commentId]);

        await client.query('COMMIT');
        return result.rows[0];
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};

// Categories and tags
const getThreadCategories = async () => {
    const query = 'SELECT * FROM thread_categories ORDER BY name';
    const result = await db.query(query);
    return result.rows;
};

const addThreadCategories = async (threadId, categoryIds) => {
    const values = categoryIds.map(categoryId => [threadId, categoryId]);
    const query = `
        INSERT INTO thread_category_mappings (thread_id, category_id)
        SELECT * FROM UNNEST($1::int[], $2::int[])
        ON CONFLICT DO NOTHING
        RETURNING *`;
    const result = await db.query(query, [
        categoryIds.map(() => threadId),
        categoryIds
    ]);
    return result.rows;
};

// Content reports
const createReport = async (reporterId, reason, threadId = null, commentId = null) => {
    const query = `
        INSERT INTO content_reports (reporter_id, thread_id, comment_id, reason)
        VALUES ($1, $2, $3, $4)
        RETURNING *`;
    const result = await db.query(query, [reporterId, threadId, commentId, reason]);
    return result.rows[0];
};

const getReports = async (status = 'pending') => {
    const query = `
        SELECT r.*, 
            t.title as thread_title,
            c.content as comment_content,
            u.username as reporter_username
        FROM content_reports r
        LEFT JOIN threads t ON r.thread_id = t.thread_id
        LEFT JOIN comments c ON r.comment_id = c.comment_id
        LEFT JOIN users u ON r.reporter_id = u.user_id
        WHERE r.status = $1
          AND (
            (r.thread_id IS NULL OR t.deleted_at IS NULL)
            AND
            (r.comment_id IS NULL OR c.deleted_at IS NULL)
          )
        ORDER BY r.created_at DESC`;
    const result = await db.query(query, [status]);
    return result.rows;
};

const resolveReport = async (reportId, resolverId, status) => {
    const query = `
        UPDATE content_reports
        SET status = $1, resolved_at = CURRENT_TIMESTAMP, resolved_by = $2
        WHERE report_id = $3
        RETURNING *`;
    const result = await db.query(query, [status, resolverId, reportId]);
    return result.rows[0];
};

// User profile and history
const getUserThreads = async (userId) => {
    const query = `
        SELECT t.*, 
            COUNT(DISTINCT c.comment_id) as comment_count,
            COUNT(DISTINCT l.like_id) as like_count
        FROM threads t
        LEFT JOIN comments c ON t.thread_id = c.thread_id
        LEFT JOIN thread_likes l ON t.thread_id = l.thread_id
        WHERE t.user_id = $1 AND t.deleted_at IS NULL
        GROUP BY t.thread_id
        ORDER BY t.created_at DESC`;
    const result = await db.query(query, [userId]);
    return result.rows;
};

const getUserComments = async (userId) => {
    const query = `
        SELECT c.*, 
            t.title as thread_title,
            COUNT(l.like_id) as like_count
        FROM comments c
        JOIN threads t ON c.thread_id = t.thread_id
        LEFT JOIN comment_likes l ON c.comment_id = l.comment_id
        WHERE c.user_id = $1 AND c.deleted_at IS NULL
        GROUP BY c.comment_id, t.title
        ORDER BY c.created_at DESC`;
    const result = await db.query(query, [userId]);
    return result.rows;
};

// Search functionality
const searchThreads = async (searchTerm) => {
    const query = `
        SELECT t.*, 
            COUNT(DISTINCT c.comment_id) as comment_count,
            COUNT(DISTINCT l.like_id) as like_count,
            tc.name as category_name
        FROM threads t
        LEFT JOIN comments c ON t.thread_id = c.thread_id
        LEFT JOIN thread_likes l ON t.thread_id = l.thread_id
        LEFT JOIN thread_category_mappings tcm ON t.thread_id = tcm.thread_id
        LEFT JOIN thread_categories tc ON tcm.category_id = tc.category_id
        WHERE t.deleted_at IS NULL 
        AND (
            t.title ILIKE $1 
            OR t.content ILIKE $1
            OR EXISTS (
                SELECT 1 FROM comments 
                WHERE thread_id = t.thread_id 
                AND content ILIKE $1
            )
        )
        GROUP BY t.thread_id, tc.name
        ORDER BY t.created_at DESC`;
    const result = await db.query(query, [`%${searchTerm}%`]);
    return result.rows;
};


const getTopicThreadCounts = async () => {
    const query = `
        SELECT
            top.topic_id,
            COUNT(t.thread_id) AS thread_count
        FROM
            topics top
        LEFT JOIN
            threads t ON top.topic_id = t.topic_id AND t.deleted_at IS NULL
        GROUP BY
            top.topic_id;
    `;
    const result = await db.query(query);
    return result.rows;
};

module.exports = {
    getAllTopics,
    getTopicById,
    createThread,
    getThreadsByTopic,
    getThreadById,
    createComment,
    getCommentsByThread,
    getCommentById,
    toggleThreadLike,
    toggleCommentLike,
    getUserRoles,
    isUserModerator,
    softDeleteThread,
    softDeleteComment,
    editThread,
    editComment,
    getThreadCategories,
    addThreadCategories,
    createReport,
    getReports,
    resolveReport,
    getUserThreads,
    getUserComments,
    searchThreads,
    getTopicThreadCounts,
    isUserAdmin,
    deleteThread,
};
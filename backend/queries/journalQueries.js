// backend/queries/journalQueries.js
const db = require('../db');

const createJournalEntry = async (userId, entryData) => {
    const { title, content, mood = 'neutral', is_locked = false, category_id = null } = entryData;
    
    const query = `
        INSERT INTO journal_entries 
        (user_id, title, content, mood, is_locked, category_id)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id, title, content, mood, created_at, updated_at, is_locked, category_id;
    `;
    
    const values = [userId, title, content, mood, is_locked, category_id];
    const result = await db.query(query, values);
    return result.rows[0];
};

const updateJournalEntry = async (entryId, userId, entryData) => {
    const { title, content, mood, is_locked, category_id } = entryData;
    
    const query = `
        UPDATE journal_entries 
        SET title = $1, 
            content = $2, 
            mood = $3, 
            is_locked = $4, 
            category_id = $5,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $6 AND user_id = $7
        RETURNING id, title, content, mood, created_at, updated_at, is_locked, category_id;
    `;
    
    const values = [title, content, mood, is_locked, category_id, entryId, userId];
    const result = await db.query(query, values);
    return result.rows[0];
};

const getJournalEntries = async (userId) => {
    const query = `
        SELECT 
            je.id,
            je.title,
            CASE WHEN je.is_locked THEN NULL ELSE je.content END as content,
            je.mood,
            je.created_at,
            je.updated_at,
            je.is_locked,
            je.category_id,
            jc.name as category_name
        FROM journal_entries je
        LEFT JOIN journal_categories jc ON je.category_id = jc.category_id
        WHERE je.user_id = $1
        ORDER BY je.created_at DESC;
    `;
    
    const result = await db.query(query, [userId]);
    return result.rows;
};

const getJournalEntryById = async (entryId, userId) => {
    const query = `
        SELECT 
            je.id,
            je.title,
            je.content,
            je.mood,
            je.created_at,
            je.updated_at,
            je.is_locked,
            je.category_id,
            jc.name as category_name
        FROM journal_entries je
        LEFT JOIN journal_categories jc ON je.category_id = jc.category_id
        WHERE je.id = $1 AND je.user_id = $2;
    `;
    
    const result = await db.query(query, [entryId, userId]);
    return result.rows[0];
};

const deleteJournalEntry = async (entryId, userId) => {
    const query = `
        DELETE FROM journal_entries 
        WHERE id = $1 AND user_id = $2
        RETURNING id;
    `;
    
    const result = await db.query(query, [entryId, userId]);
    return result.rows[0];
};

const getJournalCategories = async () => {
    const query = `
        SELECT category_id, name
        FROM journal_categories
        ORDER BY name;
    `;
    
    const result = await db.query(query);
    return result.rows;
};

module.exports = {
    createJournalEntry,
    updateJournalEntry,
    getJournalEntries,
    getJournalEntryById,
    deleteJournalEntry,
    getJournalCategories
};
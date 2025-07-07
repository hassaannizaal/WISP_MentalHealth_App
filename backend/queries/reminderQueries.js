const db = require('../db');

// In reminderQueries.js, update all queries:

const getReminders = async (userId) => {
    const query = `
        SELECT 
            id, type, title, time, 
            enabled, created_at, updated_at, frequency
        FROM reminders 
        WHERE user_id = $1 
        ORDER BY created_at DESC;
    `;
    const result = await db.query(query, [userId]);
    return result.rows;
};

// Create a new reminder
const createReminder = async (userId, { type, title, time, enabled = true, frequency = null }) => {
    const query = `
        INSERT INTO reminders (
            user_id, type, title, time, enabled, frequency
        )
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING 
            id, type, title, time, 
            enabled, created_at, updated_at, frequency;
    `;
    
    const values = [userId, type, title, time, enabled, frequency];
    const result = await db.query(query, values);
    return result.rows[0];
};

// Update a reminder
const updateReminder = async (id, userId, updates) => {
    // Filter out any undefined values
    Object.keys(updates).forEach(key => 
        updates[key] === undefined && delete updates[key]
    );
    
    if (Object.keys(updates).length === 0) {
        // Nothing to update
        return null;
    }
    
    // Build the SET clause
    const updates_array = [];
    const values = [id, userId];
    let paramCount = 3;
    
    Object.entries(updates).forEach(([key, value]) => {
        updates_array.push(`${key} = $${paramCount}`);
        values.push(value);
        paramCount++;
    });
    
    const query = `
        UPDATE reminders 
        SET ${updates_array.join(', ')}, updated_at = CURRENT_TIMESTAMP
        WHERE id = $1 AND user_id = $2
        RETURNING 
            id, type, title, time, 
            enabled, created_at, updated_at, frequency;
    `;

    const result = await db.query(query, values);
    return result.rows[0];
};

// Delete a reminder
const deleteReminder = async (id, userId) => {
    const query = `
        DELETE FROM reminders 
        WHERE id = $1 AND user_id = $2
        RETURNING id;
    `;
    const result = await db.query(query, [id, userId]);
    return result.rows[0];
};

module.exports = {
    getReminders,
    createReminder,
    updateReminder,
    deleteReminder
};
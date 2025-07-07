const db = require('../db');
const bcrypt = require('bcrypt');
const saltRounds = 10;

const updateUserProfile = async (userId, profileData) => {
    const client = await db.pool.connect();
    try {
        await client.query('BEGIN');

        // Explicitly list allowed fields to update for security
        const allowedFields = [
            'username', 'full_name', 'email', 'date_of_birth', 'gender',
            'bio', 'profile_image', 'emergency_contact_name',
            'emergency_contact_phone', 'water_goal_ml',
            'role'
        ];

        const setClauses = [];
        const values = [userId];
        let paramIndex = 2;

        Object.keys(profileData).forEach(field => {
            if (allowedFields.includes(field) && profileData[field] !== undefined) {
                if (field === 'profile_image' && profileData[field]) {
                    let imageData = profileData[field];
                    if (imageData.startsWith('data:image')) {
                        imageData = imageData.split(',')[1];
                    }
                    setClauses.push(`${field} = $${paramIndex}`);
                    values.push(imageData);
                } else {
                    setClauses.push(`${field} = $${paramIndex}`);
                    values.push(profileData[field]);
                }
                paramIndex++;
            }
        });

        if (setClauses.length === 0) {
            throw new Error('No valid fields provided for update.');
        }

        // Validate email format if being updated
        if (profileData.email) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(profileData.email)) {
                throw new Error('Invalid email format');
            }
            
            // Check email uniqueness
            const emailCheck = await client.query(
                'SELECT user_id FROM users WHERE email = $1 AND user_id != $2',
                [profileData.email, userId]
            );
            if (emailCheck.rows.length > 0) {
                throw new Error('Email already in use');
            }
        }

        // Validate username if being updated
        if (profileData.username) {
            const usernameCheck = await client.query(
                'SELECT user_id FROM users WHERE username = $1 AND user_id != $2',
                [profileData.username, userId]
            );
            if (usernameCheck.rows.length > 0) {
                throw new Error('Username already taken');
            }
        }

        const query = `
            UPDATE users
            SET ${setClauses.join(', ')}, updated_at = CURRENT_TIMESTAMP
            WHERE user_id = $1
            RETURNING 
                user_id, username, full_name, email, date_of_birth, 
                gender, bio, profile_image, emergency_contact_name,
                emergency_contact_phone, water_goal_ml, role,
                created_at, updated_at, journal_password_hash;
        `;

        const result = await client.query(query, values);
        if (result.rows.length === 0) {
            throw new Error('User not found');
        }

        await client.query('COMMIT');
        return result.rows[0];
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};

const getUserRoles = async (userId) => {
    const query = `
        SELECT role 
        FROM users
        WHERE user_id = $1;
    `;
    const { rows } = await db.query(query, [userId]);
    if (rows.length > 0) {
        // Return it in an array of objects format, similar to what 'isAdmin' might expect if roles came from a separate table
        return [{ role: rows[0].role }]; 
    }
    return []; // Return empty array if user not found or no role (shouldn't happen if user exists)
};

const setJournalPasswordHash = async (userId, plainPassword) => {
    const client = await db.pool.connect();
    try {
        await client.query('BEGIN');

        // Verify user exists
        const userCheck = await client.query('SELECT 1 FROM users WHERE user_id = $1', [userId]);
        if (userCheck.rows.length === 0) {
            throw new Error('User not found');
        }

        const hash = await bcrypt.hash(plainPassword, saltRounds);
        const query = `
            UPDATE users 
            SET journal_password_hash = $1, updated_at = CURRENT_TIMESTAMP 
            WHERE user_id = $2 
            RETURNING user_id;
        `;

        const result = await client.query(query, [hash, userId]);
        await client.query('COMMIT');
        return result.rows[0];
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};

const removeJournalPasswordHash = async (userId) => {
    const client = await db.pool.connect();
    try {
        await client.query('BEGIN');
        
        const query = `
            UPDATE users 
            SET journal_password_hash = NULL, updated_at = CURRENT_TIMESTAMP 
            WHERE user_id = $1 
            RETURNING user_id;
        `;
        
        const result = await client.query(query, [userId]);
        await client.query('COMMIT');
        return result.rows[0];
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};

const getUserJournalPasswordHash = async (userId) => {
    const query = `SELECT journal_password_hash FROM users WHERE user_id = $1;`;
    const result = await db.query(query, [userId]);
    return result.rows[0]?.journal_password_hash;
};

const getAllUsers = async () => {
    const query = `
        SELECT 
            user_id, username, email, is_admin, created_at, updated_at,
            full_name, role, is_banned
        FROM users 
        ORDER BY created_at DESC;
    `;
    const result = await db.query(query);
    return result.rows;
};

const deleteUserById = async (userId) => {
    const client = await db.pool.connect();
    try {
        await client.query('BEGIN');
        
        // Delete all related data first (the cascade will handle this, but let's be explicit)
        await client.query('DELETE FROM journal_entries WHERE user_id = $1', [userId]);
        await client.query('DELETE FROM mood_logs WHERE user_id = $1', [userId]);
        await client.query('DELETE FROM water_logs WHERE user_id = $1', [userId]);
        
        const query = 'DELETE FROM users WHERE user_id = $1 RETURNING user_id;';
        const result = await client.query(query, [userId]);
        
        await client.query('COMMIT');
        return result.rows[0];
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};

const setUserBanStatus = async (userId, is_banned) => {
    const query = `
        UPDATE users
        SET is_banned = $1, updated_at = CURRENT_TIMESTAMP
        WHERE user_id = $2
        RETURNING user_id, username, is_banned, role;
    `;
    const { rows } = await db.query(query, [is_banned, userId]);
    if (rows.length === 0) {
        throw new Error('User not found or update failed');
    }
    return rows[0];
};

module.exports = {
    updateUserProfile,
    getAllUsers,
    deleteUserById,
    getUserRoles,
    setJournalPasswordHash,
    removeJournalPasswordHash,
    getUserJournalPasswordHash,
    setUserBanStatus
};
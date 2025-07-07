const db = require('../db');

const createUser = async (username, email, passwordHash) => {
    const client = await db.pool.connect();
    try {
        await client.query('BEGIN');

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            throw new Error('Invalid email format');
        }

        // Check for existing email and username
        const checkQuery = `
            SELECT 
                CASE WHEN EXISTS(SELECT 1 FROM users WHERE email = $1) THEN true ELSE false END as email_exists,
                CASE WHEN EXISTS(SELECT 1 FROM users WHERE username = $2) THEN true ELSE false END as username_exists;
        `;
        const checkResult = await client.query(checkQuery, [email, username]);
        
        if (checkResult.rows[0].email_exists) {
            throw new Error('Email already registered');
        }
        if (checkResult.rows[0].username_exists) {
            throw new Error('Username already taken');
        }

        const insertQuery = `
            INSERT INTO users (
                username, 
                email, 
                password_hash,
                is_admin,
                role,
                water_goal_ml,
                mindfulness_reminders_enabled,
                mindfulness_reminders_time,
                water_reminders_enabled,
                water_reminders_frequency_hours,
                hydration_goal,
                mindfulness_reminder_time
            )
            VALUES (
                $1, $2, $3, 
                FALSE, 
                'user',
                2000,
                TRUE,
                '09:00:00',
                TRUE,
                2,
                2000,
                '09:00:00'
            )
            RETURNING 
                user_id, username, email, is_admin, 
                created_at, role, water_goal_ml,
                mindfulness_reminders_enabled,
                mindfulness_reminders_time,
                water_reminders_enabled,
                water_reminders_frequency_hours,
                journal_password_hash;
        `;
        const result = await client.query(insertQuery, [username, email, passwordHash]);

        await client.query('COMMIT');
        return result.rows[0];
    } catch (error) {
        await client.query('ROLLBACK');
        if (error.code === '23505') { // Unique violation
            if (error.constraint === 'users_email_key') {
                throw new Error('Email already registered');
            }
            if (error.constraint === 'users_username_key') {
                throw new Error('Username already taken');
            }
        }
        throw error;
    } finally {
        client.release();
    }
};

const findUserByEmail = async (email) => {
    const query = `
        SELECT 
            user_id, 
            username, 
            email, 
            password_hash, 
            is_admin, 
            role,  -- Ensure role is selected
            is_banned -- Select the is_banned field
        FROM users 
        WHERE email = $1;
    `;
    const { rows } = await db.query(query, [email]);
    return rows[0];
};

const findUserByUsername = async (username) => {
    const query = `
        SELECT 
            user_id, username, email, password_hash, is_admin,
            role, created_at, updated_at
        FROM users
        WHERE username = $1;
    `;
    const result = await db.query(query, [username]);
    return result.rows[0];
};

const findUserById = async (userId) => {
    const query = `
        SELECT 
            user_id, username, email, is_admin,
            full_name, date_of_birth, gender, bio,
            emergency_contact_name, emergency_contact_phone,
            water_goal_ml, role, created_at, updated_at
        FROM users
        WHERE user_id = $1;
    `;
    const result = await db.query(query, [userId]);
    return result.rows[0];
};

module.exports = {
    createUser,
    findUserByEmail,
    findUserByUsername,
    findUserById
};
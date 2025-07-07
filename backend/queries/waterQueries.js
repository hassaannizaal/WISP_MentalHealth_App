const db = require('../db');

// Add a function to get user's water goal
const getUserWaterGoal = async (userId) => {
    const query = `
        SELECT water_goal_ml
        FROM users
        WHERE user_id = $1;
    `;
    
    try {
        const result = await db.query(query, [userId]);
        // Return default 3700ml if no goal is set
        return result.rows.length > 0 ? parseInt(result.rows[0].water_goal_ml) : 3700;
    } catch (error) {
        console.error('Error getting user water goal:', error);
        throw error;
    }
};

// Add a function to update user's water goal
const updateUserWaterGoal = async (userId, goalMl) => {
    const query = `
        UPDATE users
        SET water_goal_ml = $2
        WHERE user_id = $1
        RETURNING water_goal_ml;
    `;
    
    try {
        const result = await db.query(query, [userId, goalMl]);
        return parseInt(result.rows[0].water_goal_ml);
    } catch (error) {
        console.error('Error updating user water goal:', error);
        throw error;
    }
};

const logWaterIntake = async (userId, amountMl) => {
    const client = await db.pool.connect();
    try {
        await client.query('BEGIN');

        // Validate amount
        if (!Number.isInteger(amountMl) || amountMl <= 0) {
            throw new Error('Amount must be a positive integer');
        }

        // Check if user exists
        const userCheck = await client.query('SELECT 1 FROM users WHERE user_id = $1', [userId]);
        if (userCheck.rows.length === 0) {
            throw new Error('User not found');
        }

        const query = `
            INSERT INTO water_logs (user_id, amount_ml)
            VALUES ($1, $2)
            RETURNING log_id, user_id, amount_ml, logged_at;
        `;
        const result = await client.query(query, [userId, amountMl]);
        
        // Don't automatically increase the goal when user reaches it
        // Just update the total for the day
        await client.query('COMMIT');
        return result.rows[0];
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};

const getWaterIntakeForDay = async (userId, date) => {
    const query = `
        SELECT COALESCE(SUM(amount_ml), 0) AS total_intake,
               COUNT(*) as log_count,
               MIN(logged_at) as first_log,
               MAX(logged_at) as last_log
        FROM water_logs
        WHERE user_id = $1 
        AND DATE(logged_at AT TIME ZONE 'UTC') = $2;
    `;
    
    try {
        const result = await db.query(query, [userId, date]);
        return {
            total_intake: parseInt(result.rows[0].total_intake),
            log_count: parseInt(result.rows[0].log_count),
            first_log: result.rows[0].first_log,
            last_log: result.rows[0].last_log
        };
    } catch (error) {
        console.error('Error getting daily water intake:', error);
        throw error;
    }
};

const getDetailedWaterLogsForDay = async (userId, date) => {
    const query = `
        SELECT 
            log_id,
            amount_ml,
            logged_at,
            EXTRACT(HOUR FROM logged_at) as hour,
            EXTRACT(MINUTE FROM logged_at) as minute
        FROM water_logs
        WHERE user_id = $1 
        AND DATE(logged_at AT TIME ZONE 'UTC') = $2
        ORDER BY logged_at ASC;
    `;
    
    try {
        const result = await db.query(query, [userId, date]);
        return result.rows.map(row => ({
            ...row,
            amount_ml: parseInt(row.amount_ml),
            hour: parseInt(row.hour),
            minute: parseInt(row.minute)
        }));
    } catch (error) {
        console.error('Error getting detailed water logs:', error);
        throw error;
    }
};

const getWaterIntakeStats = async (userId, startDate, endDate) => {
    const query = `
        WITH daily_totals AS (
            SELECT 
                DATE(logged_at AT TIME ZONE 'UTC') as log_date,
                SUM(amount_ml) as daily_total
            FROM water_logs
            WHERE user_id = $1
            AND DATE(logged_at AT TIME ZONE 'UTC') BETWEEN $2 AND $3
            GROUP BY DATE(logged_at AT TIME ZONE 'UTC')
        ),
        user_goal AS (
            SELECT water_goal_ml
            FROM users
            WHERE user_id = $1
        )
        SELECT 
            COALESCE(AVG(daily_total), 0) as average_daily_intake,
            COALESCE(MAX(daily_total), 0) as max_daily_intake,
            COUNT(*) as days_logged,
            COUNT(CASE WHEN daily_total >= (SELECT water_goal_ml FROM user_goal) THEN 1 END) as goal_achieved_days
        FROM daily_totals;
    `;
    
    try {
        const result = await db.query(query, [userId, startDate, endDate]);
        return {
            average_daily_intake: Math.round(result.rows[0].average_daily_intake),
            max_daily_intake: parseInt(result.rows[0].max_daily_intake),
            days_logged: parseInt(result.rows[0].days_logged),
            goal_achieved_days: parseInt(result.rows[0].goal_achieved_days)
        };
    } catch (error) {
        console.error('Error getting water intake stats:', error);
        throw error;
    }
};

// Get water intake progress (percentage)
const getWaterIntakeProgress = async (userId, date) => {
    try {
        // Get user's water goal
        const goal = await getUserWaterGoal(userId);
        
        // Get today's intake
        const { total_intake } = await getWaterIntakeForDay(userId, date);
        
        // Calculate percentage
        const percentage = Math.min(100, Math.round((total_intake / goal) * 100));
        
        return {
            goal,
            current: total_intake,
            percentage,
            remaining: Math.max(0, goal - total_intake)
        };
    } catch (error) {
        console.error('Error calculating water intake progress:', error);
        throw error;
    }
};

module.exports = {
    logWaterIntake,
    getWaterIntakeForDay,
    getDetailedWaterLogsForDay,
    getWaterIntakeStats,
    getUserWaterGoal,
    updateUserWaterGoal,
    getWaterIntakeProgress
};
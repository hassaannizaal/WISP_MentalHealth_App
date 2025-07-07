const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function testDatabase() {
  try {
    // Test users table
    const usersResult = await pool.query('SELECT COUNT(*) FROM users');
    console.log('Users table count:', usersResult.rows[0].count);

    // Test mood_logs table
    const moodsResult = await pool.query('SELECT COUNT(*) FROM mood_logs');
    console.log('Mood logs table count:', moodsResult.rows[0].count);

    // Test journal_entries table
    const journalsResult = await pool.query('SELECT COUNT(*) FROM journal_entries');
    console.log('Journal entries table count:', journalsResult.rows[0].count);

    // Close the pool
    await pool.end();
    console.log('Database connection closed.');
  } catch (error) {
    console.error('Error testing database:', error);
    process.exit(1);
  }
}

testDatabase(); 
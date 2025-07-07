const db = require('./db');

async function runMigration() {
  const client = await db.pool.connect();
  
  try {
    await client.query('BEGIN');

    // Add journal_password_hash column
    await client.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS journal_password_hash VARCHAR(255);
    `);
    console.log('Successfully added journal_password_hash column');

    // Drop old reminders tables if they exist
    await client.query(`
      DROP TABLE IF EXISTS mindfulness_reminders CASCADE;
      DROP TABLE IF EXISTS water_reminders CASCADE;
    `);
    console.log('Dropped old reminders tables');

    // Create new consolidated reminders table
    await client.query(`
      CREATE TABLE IF NOT EXISTS reminders (
        reminder_id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
        type VARCHAR(20) NOT NULL CHECK (type IN ('mindfulness', 'water', 'mood')),
        title VARCHAR(255) NOT NULL,
        time TIME NOT NULL,
        frequency_hours INTEGER,
        enabled BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Created new reminders table');

    // Create index on reminders table
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_reminders_user_type ON reminders(user_id, type);
    `);
    console.log('Created index on reminders table');

    await client.query('COMMIT');
    console.log('Migration completed successfully');
    process.exit(0);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error running migration:', error);
    process.exit(1);
  } finally {
    client.release();
  }
}

runMigration();
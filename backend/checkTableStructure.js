const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function checkTableStructure() {
  try {
    const result = await pool.query(`
      SELECT column_name, data_type, character_maximum_length, column_default, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'users'
      ORDER BY ordinal_position;
    `);

    console.log('Users Table Structure:');
    console.log('=====================');
    result.rows.forEach(column => {
      console.log(`Column: ${column.column_name}`);
      console.log(`Type: ${column.data_type}${column.character_maximum_length ? `(${column.character_maximum_length})` : ''}`);
      console.log(`Default: ${column.column_default || 'none'}`);
      console.log(`Nullable: ${column.is_nullable}`);
      console.log('---------------------');
    });

    await pool.end();
  } catch (error) {
    console.error('Error checking table structure:', error);
    process.exit(1);
  }
}

checkTableStructure(); 
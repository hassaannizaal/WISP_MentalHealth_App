const db = require('./db');

async function removePinLockFeatures() {
    try {
        await db.query(`
            ALTER TABLE threads
            DROP COLUMN IF EXISTS is_pinned,
            DROP COLUMN IF EXISTS is_locked;
        `);
        console.log('Successfully removed pin and lock columns from threads table');
        process.exit(0);
    } catch (error) {
        console.error('Error removing pin and lock columns:', error);
        process.exit(1);
    }
}

removePinLockFeatures();
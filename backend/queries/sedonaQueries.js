const db = require('../db');

const logSedonaSession = async (userId, reflectionText) => {
    const queryText = `
        INSERT INTO sedona_method_logs (user_id, reflection_text)
        VALUES ($1, $2)
        RETURNING log_id, user_id, session_timestamp, reflection_text;
    `;
    const values = [userId, reflectionText];
    try {
        const res = await db.query(queryText, values);
        return res.rows[0];
    } catch (err) {
        console.error('Error logging Sedona session:', err);
        throw err;
    }
};

 const getSedonaLogsByUser = async (userId) => {
  const queryText = `
    SELECT log_id, session_timestamp, reflection_text
    FROM sedona_method_logs
    WHERE user_id = $1
    ORDER BY session_timestamp DESC;
  `;
  const values = [userId];
  try {
    const res = await db.query(queryText, values);
    return res.rows;
  } catch (err) {
    console.error('Error getting Sedona logs:', err);
    throw err;
  }
};


module.exports = {
    logSedonaSession,
    getSedonaLogsByUser
}; 
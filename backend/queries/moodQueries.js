const db = require('../db');

const logMood = async (userId, mood, note, intensity = 3) => {
  // Validate mood input against allowed values from schema (case-insensitive)
  const allowedMoods = ['happy', 'sad', 'angry', 'anxious', 'neutral'];
  const normalizedMood = mood.toLowerCase();
  if (!allowedMoods.includes(normalizedMood)) {
    throw new Error(`Invalid mood value: ${mood}. Must be one of ${allowedMoods.join(', ')}.`);
  }

  if (intensity < 1 || intensity > 5) {
    throw new Error('Mood intensity must be between 1 and 5');
  }

  const queryText = `
    INSERT INTO mood_logs (user_id, mood, note, mood_intensity)
    VALUES ($1, $2, $3, $4)
    RETURNING log_id, user_id, mood, note, mood_intensity, logged_at;
  `;
  const values = [userId, normalizedMood, note, intensity];
  try {
    const res = await db.query(queryText, values);
    return res.rows[0];
  } catch (err) {
    console.error('Error logging mood:', err);
    throw err;
  }
};

// Function to get moods, potentially filtered by date range
// startTime and endTime should be ISO 8601 formatted strings (e.g., '2024-04-01T00:00:00Z')
const getMoodsByUser = async (userId, startTime, endTime) => {
  let queryText = `
    SELECT log_id, mood, note, mood_intensity, logged_at
    FROM mood_logs
    WHERE user_id = $1
  `;
  const values = [userId];
  let paramIndex = 2; // Start parameter index after user_id

  if (startTime) {
    queryText += ` AND logged_at >= $${paramIndex}`;
    values.push(startTime);
    paramIndex++;
  }
  if (endTime) {
    queryText += ` AND logged_at <= $${paramIndex}`;
    values.push(endTime);
    paramIndex++;
  }

  queryText += ` ORDER BY logged_at ASC;`; // Order by time for trend analysis

  try {
    const res = await db.query(queryText, values);
    return res.rows;
  } catch (err) {
    console.error('Error getting mood logs:', err);
    throw err;
  }
};

const getOverallMoodSummary = async () => {
  try {
    // Using the PostgreSQL-friendly version
    const pgSummaryQuery = `
      WITH MoodCounts AS (
        SELECT mood, COUNT(*) as count
        FROM mood_logs
        GROUP BY mood
      ),
      OverallStats AS (
        SELECT
          COUNT(*) as total_entries,
          AVG(mood_intensity) as average_mood_score
        FROM mood_logs
      )
      SELECT
        os.total_entries,
        os.average_mood_score,
        (SELECT json_object_agg(mc.mood, mc.count) FROM MoodCounts mc) as mood_counts
      FROM OverallStats os;
    `;
    
    const { rows } = await db.query(pgSummaryQuery); // Ensure 'db' is your pooled connection

    if (rows.length > 0) {
      const result = rows[0];
      const moodCounts = result.mood_counts || {};
      
      // Convert counts from string to int if necessary
      for (const key in moodCounts) {
          if (moodCounts.hasOwnProperty(key)) {
              moodCounts[key] = parseInt(moodCounts[key], 10);
          }
      }

      return {
        total_entries: parseInt(result.total_entries, 10) || 0,
        average_mood_score: result.average_mood_score ? parseFloat(result.average_mood_score) : null,
        mood_counts: moodCounts,
      };
    }
    return {
        total_entries: 0,
        average_mood_score: null,
        mood_counts: {}
    };
  } catch (error) {
    console.error('Error fetching mood summary query:', error);
    throw error;
  }
};

module.exports = {
  logMood,
  getMoodsByUser,
  getOverallMoodSummary,
};
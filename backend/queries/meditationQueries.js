const db = require('../db');

const getAllMeditations = async () => {
  const queryText = `
    SELECT meditation_id, title, description, theme, audio_url, duration_seconds, created_at, updated_at
    FROM guided_meditations
    ORDER BY theme, title;
  `;
  try {
    const res = await db.query(queryText);
    return res.rows;
  } catch (err) {
    console.error('Error getting all meditations:', err);
    throw err;
  }
};

const addMeditation = async (meditationData) => {
    const { title, description, theme, audio_url, duration_seconds } = meditationData;
    if (!title || !audio_url) throw new Error('Title and Audio URL are required.');

    const queryText = `
        INSERT INTO guided_meditations (title, description, theme, audio_url, duration_seconds)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *;
    `;
    const values = [title, description, theme, audio_url, duration_seconds];
    try {
        const res = await db.query(queryText, values);
        return res.rows[0];
    } catch (err) {
        console.error('Error adding meditation:', err);
         if (err.code === '23502') { // not_null_violation
             throw new Error('Missing required field (title or audio_url).');
         }
         if (err.code === '22P02') { // invalid input syntax for type integer
             throw new Error('Invalid duration_seconds format.');
         }
        throw err;
    }
};

const updateMeditation = async (meditationId, meditationData) => {
    // Similar dynamic update logic as updateResource
    const values = [meditationId];
    let paramIndex = 2;
    const setClauses = [];

     if (meditationData.title !== undefined) { setClauses.push(`title = $${paramIndex++}`); values.push(meditationData.title); }
     if (meditationData.description !== undefined) { setClauses.push(`description = $${paramIndex++}`); values.push(meditationData.description); }
     if (meditationData.theme !== undefined) { setClauses.push(`theme = $${paramIndex++}`); values.push(meditationData.theme); }
     if (meditationData.audio_url !== undefined) { setClauses.push(`audio_url = $${paramIndex++}`); values.push(meditationData.audio_url); }
     if (meditationData.duration_seconds !== undefined) { setClauses.push(`duration_seconds = $${paramIndex++}`); values.push(meditationData.duration_seconds); }


     if (setClauses.length === 0) {
        throw new Error('No valid fields provided for update.');
     }
     if (meditationData.title === '') throw new Error('Title cannot be empty.');
     if (meditationData.audio_url === '') throw new Error('Audio URL cannot be empty.');

    const queryText = `
        UPDATE guided_meditations
        SET ${setClauses.join(', ')}
        WHERE meditation_id = $1
        RETURNING *;
    `;
    try {
        const res = await db.query(queryText, values);
         if (res.rows.length === 0) {
             throw new Error('Meditation not found or update failed.');
         }
        return res.rows[0];
    } catch (err) {
         console.error('Error updating meditation:', err);
         if (err.code === '23502') {
             throw new Error('Title or Audio URL cannot be set to null.');
         }
          if (err.code === '22P02') {
             throw new Error('Invalid duration_seconds format.');
         }
        throw err;
    }
};

const deleteMeditation = async (meditationId) => {
    const queryText = 'DELETE FROM guided_meditations WHERE meditation_id = $1 RETURNING meditation_id;';
    const values = [meditationId];
    try {
        const res = await db.query(queryText, values);
        return res.rows[0];
    } catch (err) {
        console.error('Error deleting meditation:', err);
        throw err;
    }
};


module.exports = {
  getAllMeditations,
  addMeditation,
  updateMeditation,
  deleteMeditation
}; 
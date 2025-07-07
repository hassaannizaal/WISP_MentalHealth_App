const moodQueries = require('../queries/moodQueries');

const addMoodLog = async (req, res) => {
  const userId = req.user.id; // Use req.user.id
  const { mood, note } = req.body;

  if (!userId) {
      console.error('[MoodController] User ID missing in addMoodLog');
      return res.status(401).json({ message: 'Authentication error.' });
  }

  if (!mood) {
    return res.status(400).json({ message: 'Mood value is required.' });
  }

  try {
    const newLog = await moodQueries.logMood(userId, mood, note);
    res.status(201).json(newLog);
  } catch (error) {
     // Check if it's the specific error we threw in the query for invalid mood
     if (error.message.startsWith('Invalid mood value')) {
         return res.status(400).json({ message: error.message });
     }
     // Check for potential database constraint errors (like CHECK constraint failure)
     if (error.code === '23514') { // check_violation error code in PostgreSQL
         return res.status(400).json({ message: 'Invalid mood value provided.' });
     }
    console.error('Error in addMoodLog controller:', error);
    res.status(500).json({ message: 'Internal server error logging mood.' });
  }
};

const getUserMoods = async (req, res) => {
  const userId = req.user.id; // Use req.user.id
  const { start, end } = req.query;

   if (!userId) {
      console.error('[MoodController] User ID missing in getUserMoods');
      return res.status(401).json({ message: 'Authentication error.' });
   }

  try {
    // Basic validation for date formats if provided (could be more robust)
    // Example: Ensure they are valid ISO 8601 strings if they exist
    const moods = await moodQueries.getMoodsByUser(userId, start, end);
    res.status(200).json(moods); // Return just the array
  } catch (error) {
    console.error('Error in getUserMoods controller:', error);
    res.status(500).json({ message: 'Internal server error retrieving mood logs.' });
  }
};

const getMoodSummary = async (req, res) => {
  // const userId = req.user.id; // Not strictly needed if summary is global or admin-only
  // For now, let's assume this is a general summary not tied to a specific user for this endpoint
  // If it needs to be admin only, ensure isAdmin middleware is added to the route

  try {
    const summaryData = await moodQueries.getOverallMoodSummary(); // This query needs to be created
    if (!summaryData) {
        return res.status(404).json({ message: 'No mood data available to generate a summary.' });
    }
    res.status(200).json(summaryData);
  } catch (error) {
    console.error('Error in getMoodSummary controller:', error);
    res.status(500).json({ message: 'Internal server error retrieving mood summary.' });
  }
};

module.exports = {
  addMoodLog,
  getUserMoods,
  getMoodSummary,
}; 
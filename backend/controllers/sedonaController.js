// backend/controllers/sedonaController.js
const sedonaQueries = require('../queries/sedonaQueries');

const createSedonaLog = async (req, res) => {
  const userId = req.user.userId;
  const { reflectionText } = req.body; // Reflection text is optional per schema

  try {
    const newLog = await sedonaQueries.logSedonaSession(userId, reflectionText);
    res.status(201).json(newLog);
  } catch (error) {
    console.error('Error in createSedonaLog controller:', error);
    res.status(500).json({ message: 'Internal server error logging Sedona session.' });
  }
};

const listUserSedonaLogs = async (req, res) => {
  const userId = req.user.userId;
  try {
    const logs = await sedonaQueries.getSedonaLogsByUser(userId);
    res.status(200).json(logs);
  } catch (error) {
    console.error('Error listing Sedona logs controller:', error);
    res.status(500).json({ message: 'Internal server error retrieving Sedona logs.' });
  }
};

const getSedonaExercises = async (req, res) => {
  try {
    // Since Sedona exercises are static content, we'll return hardcoded data
    const exercises = [
      {
        id: 1,
        title: 'Basic Releasing',
        description: 'Learn the fundamental releasing technique',
        duration: '10 minutes',
        steps: [
          'Focus on an issue you\'d like to work on',
          'Allow yourself to feel the emotions around this issue',
          'Ask yourself: "Could I let this feeling go?"',
          'Ask yourself: "Would I let it go?"',
          'Ask yourself: "When?"'
        ]
      },
      {
        id: 2,
        title: 'Emotional Freedom',
        description: 'Release deep-seated emotional patterns',
        duration: '15 minutes',
        steps: [
          'Identify an emotional pattern you\'d like to release',
          'Welcome the feelings that arise',
          'Notice your resistance to these feelings',
          'Allow the resistance to be there',
          'Choose to let go of the resistance'
        ]
      },
      {
        id: 3,
        title: 'Goal Releasing',
        description: 'Release attachments to outcomes',
        duration: '12 minutes',
        steps: [
          'Think of a goal you\'re attached to',
          'Notice the feelings of wanting and attachment',
          'Allow yourself to want what you want',
          'Could you let go of wanting it?',
          'Notice the peace that remains'
        ]
      }
    ];

    res.status(200).json({ exercises });
  } catch (error) {
    console.error('Error in getSedonaExercises:', error);
    res.status(500).json({ message: 'Internal server error fetching Sedona exercises.' });
  }
};

module.exports = {
  createSedonaLog,
  listUserSedonaLogs,
  getSedonaExercises
};
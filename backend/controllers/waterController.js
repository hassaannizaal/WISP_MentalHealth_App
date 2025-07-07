// In backend/controllers/waterController.js

const waterQueries = require('../queries/waterQueries');
// Replace this line
// const { validateToken } = require('../middleware/auth');
// with the correct middleware import - likely authenticateToken
const authenticateToken = require('../middleware/authenticateToken');

// Get water progress for a specific date
const getWaterProgress = async (req, res) => {
  try {
    const userId = req.user.id;
    const date = req.query.date || new Date().toISOString().split('T')[0]; // Default to today
    
    const progress = await waterQueries.getWaterIntakeProgress(userId, date);
    res.json(progress);
  } catch (error) {
    console.error('Error getting water progress:', error);
    res.status(500).json({ error: 'Failed to get water progress' });
  }
};

// Rest of your code remains the same...
// Get detailed water logs for a specific date
const getDetailedWaterLogs = async (req, res) => {
  try {
    const userId = req.user.id;
    const date = req.query.date || new Date().toISOString().split('T')[0]; // Default to today
    
    const logs = await waterQueries.getDetailedWaterLogsForDay(userId, date);
    res.json({ logs });
  } catch (error) {
    console.error('Error getting detailed water logs:', error);
    res.status(500).json({ error: 'Failed to get water logs' });
  }
};

// Log water intake
const logWater = async (req, res) => {
  try {
    const userId = req.user.id;
    const { amount_ml } = req.body;
    
    if (!amount_ml || isNaN(amount_ml) || amount_ml <= 0) {
      return res.status(400).json({ error: 'Valid amount_ml is required' });
    }
    
    const log = await waterQueries.logWaterIntake(userId, parseInt(amount_ml));
    
    // Get updated progress after logging water
    const today = new Date().toISOString().split('T')[0];
    const progress = await waterQueries.getWaterIntakeProgress(userId, today);
    
    res.status(201).json({ log, progress });
  } catch (error) {
    console.error('Error logging water intake:', error);
    res.status(500).json({ error: 'Failed to log water intake' });
  }
};

// Get user's water goal
const getWaterGoal = async (req, res) => {
  try {
    const userId = req.user.id;
    const goal = await waterQueries.getUserWaterGoal(userId);
    res.json({ goal });
  } catch (error) {
    console.error('Error getting water goal:', error);
    res.status(500).json({ error: 'Failed to get water goal' });
  }
};

// Update user's water goal
const updateWaterGoal = async (req, res) => {
  try {
    const userId = req.user.id;
    const { goal_ml } = req.body;
    
    if (!goal_ml || isNaN(goal_ml) || goal_ml <= 0) {
      return res.status(400).json({ error: 'Valid goal_ml is required' });
    }
    
    const updatedGoal = await waterQueries.updateUserWaterGoal(userId, parseInt(goal_ml));
    res.json({ goal: updatedGoal });
  } catch (error) {
    console.error('Error updating water goal:', error);
    res.status(500).json({ error: 'Failed to update water goal' });
  }
};

module.exports = {
  getWaterProgress,
  getDetailedWaterLogs,
  logWater,
  getWaterGoal,
  updateWaterGoal
};
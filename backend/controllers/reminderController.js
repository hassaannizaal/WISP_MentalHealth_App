const reminderQueries = require('../queries/reminderQueries');

const createReminder = async (req, res) => {
    try {
        const { type, title, time, enabled = true } = req.body;
        const userId = req.user.id;

        if (!type || !title || !time) {
            return res.status(400).json({ message: 'Type, title, and time are required' });
        }

        if (!['mindfulness', 'water'].includes(type)) {
            return res.status(400).json({ message: 'Invalid reminder type' });
        }

        const reminder = await reminderQueries.createReminder(userId, { type, title, time, enabled });
        res.status(201).json(reminder);
    } catch (error) {
        console.error('Error creating reminder:', error);
        res.status(500).json({ message: 'Failed to create reminder' });
    }
};

const getReminders = async (req, res) => {
    try {
        const userId = req.user.id;
        const reminders = await reminderQueries.getReminders(userId);
        
        // Group reminders by type for frontend
        const groupedReminders = {
            mindfulness: reminders.filter(r => r.type === 'mindfulness'),
            water: reminders.filter(r => r.type === 'water')
        };
        
        res.json(groupedReminders);
    } catch (error) {
        console.error('Error fetching reminders:', error);
        res.status(500).json({ message: 'Failed to fetch reminders' });
    }
};

const updateReminder = async (req, res) => {
    try {
        const { type, id } = req.params;
        const userId = req.user.id;
        const updates = req.body;

        if (!['mindfulness', 'water'].includes(type)) {
            return res.status(400).json({ message: 'Invalid reminder type' });
        }

        const reminder = await reminderQueries.updateReminder(id, userId, updates);
        
        if (!reminder) {
            return res.status(404).json({ message: 'Reminder not found' });
        }

        res.json(reminder);
    } catch (error) {
        console.error('Error updating reminder:', error);
        res.status(500).json({ message: 'Failed to update reminder' });
    }
};

const deleteReminder = async (req, res) => {
    try {
        const { type, id } = req.params;
        const userId = req.user.id;

        if (!['mindfulness', 'water'].includes(type)) {
            return res.status(400).json({ message: 'Invalid reminder type' });
        }

        const reminder = await reminderQueries.deleteReminder(id, userId);
        
        if (!reminder) {
            return res.status(404).json({ message: 'Reminder not found' });
        }

        res.json({ message: 'Reminder deleted successfully', id: reminder.id });
    } catch (error) {
        console.error('Error deleting reminder:', error);
        res.status(500).json({ message: 'Failed to delete reminder' });
    }
};

module.exports = {
    createReminder,
    getReminders,
    updateReminder,
    deleteReminder
};
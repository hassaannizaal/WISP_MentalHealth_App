// backend/controllers/journalController.js
const journalQueries = require('../queries/journalQueries');
const userQueries = require('../queries/userQueries');
const bcrypt = require('bcrypt');

const getJournalEntries = async (req, res) => {
    try {
        const userId = req.user.id;
        const entries = await journalQueries.getJournalEntries(userId);
        res.json(entries);
    } catch (error) {
        console.error('Error getting journal entries:', error);
        res.status(500).json({ message: 'Failed to load journal entries. Please try again later.' });
    }
};

const createJournalEntry = async (req, res) => {
    try {
        const userId = req.user.id;
        const { title, content, mood, is_locked, category_id } = req.body;

        if (!title?.trim() || !content?.trim()) {
            return res.status(400).json({ message: 'Title and content are required.' });
        }

        // Validate mood
        const validMoods = ['happy', 'sad', 'angry', 'anxious', 'neutral'];
        const validatedMood = validMoods.includes(mood) ? mood : 'neutral';

        const entry = await journalQueries.createJournalEntry(userId, {
            title: title.trim(),
            content: content.trim(),
            mood: validatedMood,
            is_locked: Boolean(is_locked),
            category_id: category_id || null
        });

        res.status(201).json(entry);
    } catch (error) {
        console.error('Error creating journal entry:', error);
        res.status(500).json({ message: 'Failed to create journal entry.' });
    }
};

const updateJournalEntry = async (req, res) => {
    try {
        const userId = req.user.id;
        const entryId = parseInt(req.params.id);
        const { title, content, mood, is_locked, category_id } = req.body;

        if (!title?.trim() || !content?.trim()) {
            return res.status(400).json({ message: 'Title and content are required.' });
        }

        // Verify entry exists and belongs to user
        const existingEntry = await journalQueries.getJournalEntryById(entryId, userId);
        if (!existingEntry) {
            return res.status(404).json({ message: 'Journal entry not found.' });
        }

        // Validate mood
        const validMoods = ['happy', 'sad', 'angry', 'anxious', 'neutral'];
        const validatedMood = validMoods.includes(mood) ? mood : 'neutral';

        const updatedEntry = await journalQueries.updateJournalEntry(entryId, userId, {
            title: title.trim(),
            content: content.trim(),
            mood: validatedMood,
            is_locked: Boolean(is_locked),
            category_id: category_id || null
        });

        res.json(updatedEntry);
    } catch (error) {
        console.error('Error updating journal entry:', error);
        res.status(500).json({ message: 'Failed to update journal entry.' });
    }
};

const deleteJournalEntry = async (req, res) => {
    try {
        const userId = req.user.id;
        const entryId = parseInt(req.params.id);

        const entry = await journalQueries.getJournalEntryById(entryId, userId);
        if (!entry) {
            return res.status(404).json({ message: 'Journal entry not found.' });
        }

        await journalQueries.deleteJournalEntry(entryId, userId);
        res.json({ message: 'Journal entry deleted successfully.' });
    } catch (error) {
        console.error('Error deleting journal entry:', error);
        res.status(500).json({ message: 'Failed to delete journal entry.' });
    }
};

const getJournalEntryById = async (req, res) => {
    try {
        const userId = req.user.id;
        const entryId = parseInt(req.params.id);

        const entry = await journalQueries.getJournalEntryById(entryId, userId);
        if (!entry) {
            return res.status(404).json({ message: 'Journal entry not found.' });
        }

        res.json(entry);
    } catch (error) {
        console.error('Error getting journal entry:', error);
        res.status(500).json({ message: 'Failed to load journal entry.' });
    }
};

const unlockJournalEntry = async (req, res) => {
    try {
        const userId = req.user.id;
        const entryId = parseInt(req.params.id);
        const { password } = req.body;

        if (!password) {
            return res.status(400).json({ message: 'Password is required.' });
        }

        // Get the entry
        const entry = await journalQueries.getJournalEntryById(entryId, userId);
        if (!entry) {
            return res.status(404).json({ message: 'Journal entry not found.' });
        }

        if (!entry.is_locked) {
            return res.status(400).json({ message: 'This entry is not locked.' });
        }

        // Verify journal password
        const storedHash = await userQueries.getUserJournalPasswordHash(userId);
        if (!storedHash) {
            return res.status(400).json({ message: 'Journal password is not set.' });
        }

        const isMatch = await bcrypt.compare(password, storedHash);
        if (!isMatch) {
            return res.status(401).json({ message: 'Incorrect journal password.' });
        }

        res.json(entry);
    } catch (error) {
        console.error('Error unlocking journal entry:', error);
        res.status(500).json({ message: 'Failed to unlock journal entry.' });
    }
};

const getJournalCategories = async (req, res) => {
    try {
        const categories = await journalQueries.getJournalCategories();
        res.json(categories);
    } catch (error) {
        console.error('Error getting journal categories:', error);
        res.status(500).json({ message: 'Failed to load categories.' });
    }
};

module.exports = {
    getJournalEntries,
    createJournalEntry,
    updateJournalEntry,
    deleteJournalEntry,
    getJournalEntryById,
    unlockJournalEntry,
    getJournalCategories
};
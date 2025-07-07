// backend/controllers/meditationController.js
const meditationQueries = require('../queries/meditationQueries');

// --- User Route ---
const listAllMeditations = async (req, res) => {
  try {
    const meditations = await meditationQueries.getAllMeditations();
    res.status(200).json(meditations);
  } catch (error) {
    console.error('Error listing meditations controller:', error);
    res.status(500).json({ message: 'Internal server error retrieving meditations.' });
  }
};

const getMeditations = async (req, res) => {
    try {
        const meditations = await meditationQueries.getAllMeditations();
        // Transform the data to match frontend expectations
        const transformedMeditations = meditations.map(meditation => ({
            id: meditation.meditation_id,
            title: meditation.title,
            description: meditation.description,
            duration: `${Math.floor(meditation.duration_seconds / 60)} minutes`,
            audioFile: meditation.audio_url
        }));
        res.status(200).json({ meditations: transformedMeditations });
    } catch (error) {
        console.error('Error in getMeditations:', error);
        res.status(500).json({ message: 'Internal server error fetching meditations.' });
    }
};

// --- Admin Routes ---
const createMeditation = async (req, res) => {
    const meditationData = req.body;
     // Add more validation as needed
    if (!meditationData || !meditationData.title || !meditationData.audio_url) {
         return res.status(400).json({ message: 'Title and Audio URL are required.' });
    }
    try {
        const newMeditation = await meditationQueries.addMeditation(meditationData);
        res.status(201).json(newMeditation);
    } catch (error) {
         if (error.message === 'Title and Audio URL are required.' || error.message === 'Missing required field (title or audio_url).' || error.message === 'Invalid duration_seconds format.') {
             return res.status(400).json({ message: error.message });
         }
         console.error('Error creating meditation controller:', error);
         res.status(500).json({ message: 'Internal server error creating meditation.' });
    }
};

 const updateExistingMeditation = async (req, res) => {
    const meditationId = parseInt(req.params.meditationId, 10);
    const meditationData = req.body;

    if (isNaN(meditationId)) {
        return res.status(400).json({ message: 'Invalid meditation ID format.' });
    }
     if (Object.keys(meditationData).length === 0) {
         return res.status(400).json({ message: 'Request body cannot be empty for update.' });
     }

    try {
        const updatedMeditation = await meditationQueries.updateMeditation(meditationId, meditationData);
        res.status(200).json(updatedMeditation);
    } catch (error) {
        if (error.message === 'No valid fields provided for update.' || error.message === 'Title cannot be empty.' || error.message === 'Audio URL cannot be empty.' || error.message === 'Title or Audio URL cannot be set to null.' || error.message === 'Invalid duration_seconds format.') {
             return res.status(400).json({ message: error.message });
         }
         if (error.message === 'Meditation not found or update failed.') {
              return res.status(404).json({ message: 'Meditation not found.' });
         }
        console.error(`Error updating meditation ${meditationId} controller:`, error);
        res.status(500).json({ message: 'Internal server error updating meditation.' });
    }
};

 const removeMeditation = async (req, res) => {
    const meditationId = parseInt(req.params.meditationId, 10);

    if (isNaN(meditationId)) {
        return res.status(400).json({ message: 'Invalid meditation ID format.' });
    }

    try {
        const deletedMeditation = await meditationQueries.deleteMeditation(meditationId);
         if (!deletedMeditation) {
             return res.status(404).json({ message: 'Meditation not found.' });
         }
        res.status(200).json({ message: `Meditation ${meditationId} deleted successfully.` });
    } catch (error) {
        console.error(`Error deleting meditation ${meditationId} controller:`, error);
        res.status(500).json({ message: 'Internal server error deleting meditation.' });
    }
};


module.exports = {
  listAllMeditations,   // User
  getMeditations,       // User
  createMeditation,     // Admin
  updateExistingMeditation, // Admin
  removeMeditation      // Admin
};
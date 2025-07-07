// backend/controllers/resourceController.js
const resourceQueries = require('../queries/resourceQueries');

// --- User Route ---
const listAllResources = async (req, res) => {
  try {
    const resources = await resourceQueries.getAllResources();
    res.status(200).json(resources);
  } catch (error) {
    console.error('Error in listAllResources controller:', error);
    res.status(500).json({ message: 'Internal server error retrieving resources.' });
  }
};

// --- Admin Routes ---
const createResource = async (req, res) => {
  const resourceData = req.body;
   // Add more validation as needed (e.g., URL format for link)
  if (!resourceData || !resourceData.category || !resourceData.title) {
    return res.status(400).json({ message: 'Category and Title are required fields.' });
  }
  try {
    const newResource = await resourceQueries.addResource(resourceData);
    res.status(201).json(newResource);
  } catch (error) {
     if (error.message.startsWith('Invalid category') || error.message === 'Title is required.') {
         return res.status(400).json({ message: error.message });
     }
     // Handle potential check constraint errors from DB
      if (error.code === '23514') {
         return res.status(400).json({ message: 'Invalid category value provided.' });
      }
      if (error.code === '23502') { // not_null_violation
          return res.status(400).json({ message: 'Missing required field (e.g., title).' });
      }
    console.error('Error creating resource controller:', error);
    res.status(500).json({ message: 'Internal server error creating resource.' });
  }
};

const updateExistingResource = async (req, res) => {
    const resourceId = parseInt(req.params.resourceId, 10);
    const resourceData = req.body;

    if (isNaN(resourceId)) {
        return res.status(400).json({ message: 'Invalid resource ID format.' });
    }
    if (Object.keys(resourceData).length === 0) {
         return res.status(400).json({ message: 'Request body cannot be empty for update.' });
    }

    try {
        const updatedResource = await resourceQueries.updateResource(resourceId, resourceData);
        res.status(200).json(updatedResource);
    } catch (error) {
         if (error.message.startsWith('Invalid category') || error.message === 'Title cannot be empty.' || error.message === 'No valid fields provided for update.') {
             return res.status(400).json({ message: error.message });
         }
         if (error.message === 'Resource not found or update failed.') {
              return res.status(404).json({ message: 'Resource not found.' });
         }
         if (error.code === '23514') {
              return res.status(400).json({ message: 'Invalid category value provided.' });
         }
        console.error(`Error updating resource ${resourceId} controller:`, error);
        res.status(500).json({ message: 'Internal server error updating resource.' });
    }
};

const removeResource = async (req, res) => {
    const resourceId = parseInt(req.params.resourceId, 10);

    if (isNaN(resourceId)) {
        return res.status(400).json({ message: 'Invalid resource ID format.' });
    }

    try {
        const deletedResource = await resourceQueries.deleteResource(resourceId);
        if (!deletedResource) {
            return res.status(404).json({ message: 'Resource not found.' });
        }
        res.status(200).json({ message: `Resource ${resourceId} deleted successfully.` });
    } catch (error) {
        console.error(`Error deleting resource ${resourceId} controller:`, error);
        res.status(500).json({ message: 'Internal server error deleting resource.' });
    }
};

module.exports = {
  listAllResources,       // User
  createResource,         // Admin
  updateExistingResource, // Admin
  removeResource          // Admin
}; 
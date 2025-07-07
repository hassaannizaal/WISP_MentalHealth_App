import axios from 'axios';
import { API_URL } from '../config';

// Get all journal entries
const getAllEntries = async () => {
  try {
    const response = await axios.get(`${API_URL}/journal/entries`);
    return response.data;
  } catch (error) {
    console.error('Error fetching journal entries:', error);
    throw error;
  }
};

// Get a single journal entry by ID
const getEntryById = async (entryId) => {
  try {
    const response = await axios.get(`${API_URL}/journal/entries/${entryId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching journal entry ${entryId}:`, error);
    throw error;
  }
};

// Create a new journal entry
const createEntry = async (entryData) => {
  try {
    const response = await axios.post(`${API_URL}/journal/entries`, entryData);
    return response.data;
  } catch (error) {
    console.error('Error creating journal entry:', error);
    throw error;
  }
};

// Update an existing journal entry
const updateEntry = async (entryId, entryData) => {
  try {
    const response = await axios.put(`${API_URL}/journal/entries/${entryId}`, entryData);
    return response.data;
  } catch (error) {
    console.error(`Error updating journal entry ${entryId}:`, error);
    throw error;
  }
};

// Delete a journal entry
const deleteEntry = async (entryId) => {
  try {
    const response = await axios.delete(`${API_URL}/journal/entries/${entryId}`);
    return response.data;
  } catch (error) {
    console.error(`Error deleting journal entry ${entryId}:`, error);
    throw error;
  }
};

export const journalService = {
  getAllEntries,
  getEntryById,
  createEntry,
  updateEntry,
  deleteEntry
}; 
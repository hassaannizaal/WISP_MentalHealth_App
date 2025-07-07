const authQueries = require('../queries/authQueries'); // Re-use query to find user by ID
const userQueries = require('../queries/userQueries'); // Import user queries
const bcrypt = require('bcrypt'); // <-- Re-add bcrypt

const getUserProfile = async (req, res) => {
  // The user ID is added to req.user by the authenticateToken middleware
  // For /me route, req.user.id is used, for /profile, req.user.userId (fix this later if needed)
  const userId = req.user.id || req.user.userId;

  if (!userId) {
    // This should technically not happen if authenticateToken middleware is used correctly
    return res.status(401).json({ message: 'Authentication required.' });
  }

  try {
    const userProfile = await authQueries.findUserById(userId);

    if (!userProfile) {
      return res.status(404).json({ message: 'User profile not found.' });
    }

    // Send the profile data (already excludes password hash thanks to the query)
    res.status(200).json(userProfile);

  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ message: 'Internal server error fetching profile.' });
  }
};

// Assign getUserProfile to getCurrentUserProfile as they seem identical based on routes
const getCurrentUserProfile = getUserProfile;

const updateCurrentUserProfile = async (req, res) => {
  // const userId = req.user.userId; // Original
  const userId = req.user.id || req.user.userId; // Use consistent ID
  const profileData = req.body; // Data comes from request body

  // Basic validation: Ensure body is not empty
  if (Object.keys(profileData).length === 0) {
      return res.status(400).json({ message: 'Request body cannot be empty.' });
  }

  try {
    const updatedProfile = await userQueries.updateUserProfile(userId, profileData);
    res.status(200).json(updatedProfile);
  } catch (error) {
    console.error('Error updating user profile controller:', error);
    if (error.message === 'No valid fields provided for update.') {
        return res.status(400).json({ message: error.message });
    }
    if (error.message === 'User not found or update failed.') {
        return res.status(404).json({ message: 'User not found.' });
    }
    // Handle potential data type errors from DB (e.g., invalid time format)
    if (error.code === '22007' || error.code === '22008') { // invalid_datetime_format or datetime_field_overflow
        return res.status(400).json({ message: 'Invalid data format provided (e.g., time, number).' });
    }
     if (error.code === '22P02') { // invalid text representation (e.g. non-integer for integer field)
       return res.status(400).json({ message: 'Invalid data type provided for a field.'});
     }
    res.status(500).json({ message: 'Internal server error updating profile.' });
  }
};

// --- Admin Functions ---

const listAllUsers = async (req, res) => {
    try {
        const users = await userQueries.getAllUsers();
        res.status(200).json(users);
    } catch (error) {
        console.error('Error listing all users:', error);
        res.status(500).json({ message: 'Internal server error listing users.' });
    }
};

const removeUser = async (req, res) => {
    const userIdToDelete = parseInt(req.params.userId, 10);

    if (isNaN(userIdToDelete)) {
        return res.status(400).json({ message: 'Invalid user ID format.' });
    }

    // Prevent admin from deleting themselves (optional safety measure)
    // if (req.user.userId === userIdToDelete) { // Original
    if (req.user.id === userIdToDelete) { // Consistent ID
        return res.status(400).json({ message: 'Admin cannot delete their own account.' });
    }

    try {
        const deletedUser = await userQueries.deleteUserById(userIdToDelete);
        if (!deletedUser) {
            return res.status(404).json({ message: 'User not found.' });
        }
        res.status(200).json({ message: `User with ID ${userIdToDelete} deleted successfully.` });
    } catch (error) {
        console.error(`Error deleting user ${userIdToDelete}:`, error);
        res.status(500).json({ message: 'Internal server error deleting user.' });
    }
};

// --- Journal Password Controllers (Re-add these) ---

// PUT /api/users/me/journal-password - Set or update the journal password
const setJournalPassword = async (req, res) => {
    const userId = req.user.id;
    const { password, current_password } = req.body;

    if (!password || password.length < 6) {
        return res.status(400).json({ message: 'Journal password must be at least 6 characters long.' });
    }

    try {
        // If there's an existing password, verify the current password first
        const existingHash = await userQueries.getUserJournalPasswordHash(userId);
        if (existingHash) {
            if (!current_password) {
                return res.status(400).json({ message: 'Current password is required to update journal password.' });
            }

            const isValid = await bcrypt.compare(current_password, existingHash);
            if (!isValid) {
                return res.status(401).json({ message: 'Current password is incorrect.' });
            }
        }

        // Set the new password
        await userQueries.setJournalPasswordHash(userId, password);
        res.status(200).json({ message: 'Journal password set successfully.' });
    } catch (error) {
        console.error('Error setting journal password:', error);
        res.status(500).json({ message: 'Failed to set journal password.' });
    }
};

// DELETE /api/users/me/journal-password - Remove the journal password
const removeJournalPassword = async (req, res) => {
    const userId = req.user.id;

    try {
        await userQueries.removeJournalPasswordHash(userId);
        res.status(200).json({ message: 'Journal password removed successfully.' });
    } catch (error) {
        console.error('Error removing journal password:', error);
        res.status(500).json({ message: 'Failed to remove journal password.' });
    }
};

// POST /api/users/me/journal-password/verify - Verify the current journal password
// Useful for confirming before removal or change
const verifyJournalPassword = async (req, res) => {
    const userId = req.user.id;
    const { password } = req.body;

    if (!password) {
        return res.status(400).json({ message: 'Password is required for verification.' });
    }

    try {
        const storedHash = await userQueries.getUserJournalPasswordHash(userId);
        if (!storedHash) {
            // No password set, so verification technically fails in a sense
            return res.status(400).json({ message: 'Journal password is not set.' });
        }

        const isMatch = await bcrypt.compare(password, storedHash);
        if (isMatch) {
            res.status(200).json({ message: 'Journal password verified successfully.', verified: true });
        } else {
            res.status(401).json({ message: 'Incorrect journal password.', verified: false });
        }
    } catch (error) {
        console.error('Error verifying journal password:', error);
        res.status(500).json({ message: 'Failed to verify journal password.' });
    }
};

// Role Management Controllers
const assignRole = async (req, res) => {
    const { userId } = req.params;
    const { role } = req.body;

    if (!role) {
        return res.status(400).json({ message: 'Role name is required' });
    }

    try {
        // Verify requesting user is an admin
        const requestingUserRoles = await userQueries.getUserRoles(req.user.id);
        const isAdmin = requestingUserRoles.some(r => r.role_name === 'admin');
        
        if (!isAdmin) {
            return res.status(403).json({ message: 'Only administrators can assign roles' });
        }

        const result = await userQueries.assignUserRole(userId, role);
        res.json({ 
            message: `Role "${role}" assigned successfully`,
            assignment: result 
        });
    } catch (error) {
        console.error('Error assigning role:', error);
        res.status(500).json({ message: error.message || 'Failed to assign role' });
    }
};

const removeRole = async (req, res) => {
    const { userId } = req.params;
    const { role } = req.body;

    if (!role) {
        return res.status(400).json({ message: 'Role name is required' });
    }

    try {
        // Verify requesting user is an admin
        const requestingUserRoles = await userQueries.getUserRoles(req.user.id);
        const isAdmin = requestingUserRoles.some(r => r.role_name === 'admin');
        
        if (!isAdmin) {
            return res.status(403).json({ message: 'Only administrators can remove roles' });
        }

        const result = await userQueries.removeUserRole(userId, role);
        res.json({ 
            message: `Role "${role}" removed successfully`,
            removal: result 
        });
    } catch (error) {
        console.error('Error removing role:', error);
        res.status(500).json({ message: error.message || 'Failed to remove role' });
    }
};

const getUserRoles = async (req, res) => {
    const { userId } = req.params;

    try {
        const roles = await userQueries.getUserRoles(userId);
        res.json(roles);
    } catch (error) {
        console.error('Error fetching user roles:', error);
        res.status(500).json({ message: 'Failed to fetch user roles' });
    }
};

const toggleUserBanStatus = async (req, res) => {
    const userIdToToggle = parseInt(req.params.userId, 10);
    const { is_banned } = req.body; // Expecting { is_banned: true/false }

    if (isNaN(userIdToToggle)) {
        return res.status(400).json({ message: 'Invalid user ID format.' });
    }
    if (typeof is_banned !== 'boolean') {
        return res.status(400).json({ message: 'is_banned (boolean) is required in the request body.' });
    }

    // Prevent admin from banning themselves (optional safety measure)
    if (req.user.id === userIdToToggle) {
        return res.status(400).json({ message: 'Admin cannot change their own ban status.' });
    }

    try {
        const updatedUser = await userQueries.setUserBanStatus(userIdToToggle, is_banned);
        res.status(200).json({ 
            message: `User ${updatedUser.username} ${is_banned ? 'banned' : 'unbanned'} successfully.`,
            user: updatedUser 
        });
    } catch (error) {
        console.error(`Error toggling ban status for user ${userIdToToggle}:`, error);
        if (error.message.includes('not found')) {
            return res.status(404).json({ message: 'User not found.' });
        }
        res.status(500).json({ message: 'Internal server error toggling ban status.' });
    }
};

module.exports = {
  getUserProfile,
  updateCurrentUserProfile,
  getCurrentUserProfile,
  listAllUsers,
  removeUser,
  setJournalPassword,
  removeJournalPassword,
  verifyJournalPassword,
  assignRole,
  removeRole,
  getUserRoles,
  toggleUserBanStatus
};
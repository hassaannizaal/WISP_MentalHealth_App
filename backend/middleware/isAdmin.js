// backend/middleware/isAdmin.js

const userQueries = require('../queries/userQueries');

const isAdmin = async (req, res, next) => {
    // This middleware should run *after* authenticateToken
    if (!req.user || !req.user.id) {
        return res.status(401).json({ message: 'Authentication required' });
    }

    try {
        // Get user roles and check if they include admin or moderator
        const roles = await userQueries.getUserRoles(req.user.id);
        const isAdminOrMod = roles.some(r => ['admin', 'moderator'].includes(r.role));
        
        if (!isAdminOrMod) {
            return res.status(403).json({ message: 'Forbidden: Requires admin/moderator privileges.' });
        }
        next();
    } catch (error) {
        console.error('Error checking admin/moderator status:', error);
        res.status(500).json({ message: 'Failed to verify permissions' });
    }
};

module.exports = isAdmin;
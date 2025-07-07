const { verifyToken } = require('../utils/authUtils');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN_STRING

  if (token == null) {
    return res.status(401).json({ message: 'Authentication token required.' }); // No token provided
  }

  const decodedData = verifyToken(token);

  if (!decodedData) {
    return res.status(403).json({ message: 'Invalid or expired token.' }); // Token is invalid or expired
  }

  // Add user data to the request object, using the correct key from decoded data
  req.user = {
      id: decodedData.id, // <-- CORRECT: Use decodedData.id
      username: decodedData.username,
      isAdmin: decodedData.isAdmin,
      // Include other relevant fields from decodedData if necessary
  };
  
  // Sanity check (should pass now)
  if (typeof req.user.id === 'undefined') {
      console.error('CRITICAL: User ID still failed to map in authenticateToken', decodedData);
      return res.status(500).json({ message: 'Internal authentication configuration error.' });
  }

  next(); // Proceed to the next middleware or route handler
};

module.exports = authenticateToken; 
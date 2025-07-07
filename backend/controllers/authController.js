const authQueries = require('../queries/authQueries');
const { hashPassword, comparePassword, generateToken } = require('../utils/authUtils');
const bcrypt = require('bcrypt');

const registerUser = async (req, res) => {
  const { username, email, password } = req.body;

  // Basic input validation
  if (!username || !email || !password) {
    return res.status(400).json({ message: 'Username, email, and password are required.' });
  }

  try {
    // Check if user already exists (by email or username)
    const existingUserByEmail = await authQueries.findUserByEmail(email);
    if (existingUserByEmail) {
      return res.status(409).json({ message: 'Email already in use.' });
    }
    const existingUserByUsername = await authQueries.findUserByUsername(username);
     if (existingUserByUsername) {
       return res.status(409).json({ message: 'Username already taken.' });
     }

    // Hash the password
    const passwordHash = await hashPassword(password);

    // Create the user in the database
    const newUser = await authQueries.createUser(username, email, passwordHash);

    // Generate a JWT token
    const tokenPayload = { 
      id: newUser.user_id,
      username: newUser.username, 
      isAdmin: newUser.is_admin 
    };
    const token = generateToken(tokenPayload);

    // Send response (excluding password hash)
    res.status(201).json({
      message: 'User registered successfully!',
      token,
      user: {
        user_id: newUser.user_id,
        username: newUser.username,
        email: newUser.email,
        isAdmin: newUser.is_admin
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    // Check for specific database errors (like unique constraint) although handled above
    if (error.code === '23505') { // Unique violation error code in PostgreSQL
         if (error.constraint === 'users_email_key') {
            return res.status(409).json({ message: 'Email already in use.' });
         }
         if (error.constraint === 'users_username_key') {
            return res.status(409).json({ message: 'Username already taken.' });
         }
    }
    res.status(500).json({ message: 'Internal server error during registration.' });
  }
};

const loginUser = async (req, res) => {
  const { email, password } = req.body;

  // Basic input validation
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  try {
    // Find the user by email
    const user = await authQueries.findUserByEmail(email);
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials.' }); // User not found
    }

    // Compare the provided password with the stored hash
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials.' }); // Password doesn't match
    }

    // --- Prepare user data for payload and response --- 
    // IMPORTANT: Remove password hash before sending user object back
    const userPayload = {
        id: user.user_id, // Add user_id to the payload
        username: user.username, 
        isAdmin: user.is_admin, // Keep isAdmin for quick checks if needed elsewhere
        role: user.role, // Add role to payload
        is_banned: user.is_banned // Add is_banned to payload
    };
    
    // Clone user object and remove sensitive hashes for the response body
    const userResponseData = { ...user };
    delete userResponseData.password_hash;

    // Generate JWT
    const token = generateToken(userPayload);

    // Send token and SAFE user data back
    res.json({ 
      message: 'Login successful', 
      token,
      user: userResponseData
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error during login.' });
  }
};

module.exports = {
  registerUser,
  loginUser,
};
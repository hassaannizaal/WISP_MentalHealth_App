const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET;
const SALT_ROUNDS = 10; // Standard practice for bcrypt salt rounds

// Hash a password
const hashPassword = async (password) => {
  return await bcrypt.hash(password, SALT_ROUNDS);
};

// Compare a plain password with a hashed password
const comparePassword = async (plainPassword, hashedPassword) => {
  return await bcrypt.compare(plainPassword, hashedPassword);
};

// Generate a JWT token
const generateToken = (payload) => {
  // Payload typically includes user ID, maybe role/username
  // Keep payload small
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '1d' }); // Token expires in 1 day
};

// Verify a JWT token
const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    // console.error('JWT Verification Error:', error.message); // Optional logging
    return null; // Indicate verification failure
  }
};

module.exports = {
  hashPassword,
  comparePassword,
  generateToken,
  verifyToken,
}; 
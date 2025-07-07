// backend/index.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();

// Import routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const journalRoutes = require('./routes/journalRoutes');
const moodRoutes = require('./routes/moodRoutes');
const waterRoutes = require('./routes/waterRoutes');
const reminderRoutes = require('./routes/reminderRoutes');
const communityRoutes = require('./routes/communityRoutes');
const quoteRoutes = require('./routes/quoteRoutes');
    

// Middleware
app.use(cors());
app.use(express.json({limit: '50mb'}));
app.use(express.urlencoded({limit: '50mb', extended: true}));

// Route middlewares
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/journal', journalRoutes);
app.use('/api/moods', moodRoutes);
app.use('/api/water', waterRoutes);
app.use('/api/reminders', reminderRoutes);
app.use('/api/community', communityRoutes);
app.use('/api/quotes', quoteRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, 'localhost', () => {
    console.log(`Server listening on http://192.168.1.7:${PORT}`);
});
// backend/controllers/quoteController.js

const quotes = [
    { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
    { text: "Peace comes from within. Do not seek it without.", author: "Buddha" },
    { text: "Happiness is not something ready made. It comes from your own actions.", author: "Dalai Lama" },
    { text: "You yourself, as much as anybody in the entire universe, deserve your love and affection.", author: "Buddha" },
    { text: "Every moment is a fresh beginning.", author: "T.S. Eliot" },
    { text: "The journey of a thousand miles begins with one step.", author: "Lao Tzu" },
    { text: "The mind is everything. What you think you become.", author: "Buddha" },
    { text: "In the middle of every difficulty lies opportunity.", author: "Albert Einstein" },
    { text: "You are never too old to set another goal or to dream a new dream.", author: "C.S. Lewis" },
    { text: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
    { text: "The way to get started is to quit talking and begin doing.", author: "Walt Disney" },
    { text: "Life is what happens when you're busy making other plans.", author: "John Lennon" },
    { text: "Everything you've ever wanted is on the other side of fear.", author: "George Addair" },
    { text: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill" },
    { text: "The only limit to our realization of tomorrow will be our doubts of today.", author: "Franklin D. Roosevelt" }
];

const getDailyQuote = (req, res) => {
    try {
        // Use the current date as a seed for consistent daily quotes
        const today = new Date();
        const dayOfYear = Math.floor((today - new Date(today.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));
        const quoteIndex = dayOfYear % quotes.length;
        
        res.json(quotes[quoteIndex]);
    } catch (error) {
        console.error('Error getting daily quote:', error);
        res.status(500).json({ 
            message: 'Failed to fetch daily quote',
            error: error.message 
        });
    }
};

module.exports = {
    getDailyQuote
}
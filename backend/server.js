require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// Import routes
const clientRoutes = require('./routes/clients');
const documentRoutes = require('./routes/documents');
const expenseRoutes = require('./routes/expenses');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Database Connection
// The user provided MONGO_URI in plain text in the prompt, but we should use process.env if available, falling back to the plain text if not strictly configured in .env yet.
const MONGODB_URI = process.env.MONGO_URI || "mongodb+srv://ajlaw2026:ajlaw2026@ajlaw.fsqrojk.mongodb.net/?appName=AJLAW";

mongoose.connect(MONGODB_URI, {
    // useNewUrlParser and useUnifiedTopology are deprecated in latest drivers, but keeping standard connection
})
.then(() => console.log('✅ Connected to MongoDB Backend Database Successfully!'))
.catch(err => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/clients', clientRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/expenses', expenseRoutes);

// Base route for health check
app.get('/', (req, res) => {
    res.send('AJ Law Firm API Backend is running!');
});

// GLOBAL ERROR HANDLER - Catch all unhandled route errors
app.use((err, req, res, next) => {
    console.error('🛑 UNHANDLED ERROR STACK:', err.stack);
    console.error('🛑 ERROR DETAILS:', {
        message: err.message,
        path: req.path,
        method: req.method,
        body: req.body
    });
    
    // In Express 5, next is likely where the error originated if it's "next is not a function"
    if (typeof next !== 'function') {
        console.error('🚨 CRITICAL: "next" is indeed not a function in this scope!');
    }

    res.status(500).json({ 
        message: 'Internal Server Error', 
        error: err.message,
        tip: 'Check server logs for the full stack trace'
    });
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});

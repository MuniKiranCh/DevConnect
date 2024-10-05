// Import necessary modules
const express = require('express');
const { connectDB } = require('./config/database');
const cookieParser = require('cookie-parser');
const app = express();  // Initialize the express application

// Middleware
// app.use('/admin', adminAuth); // Admin authentication middleware
app.use(express.json()); // Parse incoming JSON requests
app.use(cookieParser()); // Cookie parsing middleware

const authRouter=require('./routes/auth');
const profileRouter=require('./routes/profile');
const requestRouter=require('./routes/requests');

// Connect to the Database and Start the Server
connectDB()
    .then(() => {
        console.log('Database connected successfully!');
        app.listen(3000, () => {
            console.log('Server is running on port 3000');
        });
    })
    .catch((err) => {
        console.error('Database connection failed:', err);
    });

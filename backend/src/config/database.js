const mongoose = require('mongoose');
// require('dotenv').config();


const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    // console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1); // Exit the process with failure
  }
};

module.exports = connectDB;
// This module exports a function to connect to MongoDB using Mongoose.
// It uses the MONGODB_URI environment variable for the connection string.
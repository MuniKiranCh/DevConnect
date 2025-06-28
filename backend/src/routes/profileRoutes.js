const express = require('express');
const profileRouter = express.Router();
const { getUserProfile, updateProfile, searchUsers, getSuggestedConnections } = require('../controllers/profileController');
const { userAuth } = require('../middlewares/authMiddleware');
const { validateObjectId } = require('../utils/validation');

// Apply authentication middleware to all routes
profileRouter.use(userAuth);

// Get user profile by ID
profileRouter.get('/user/:userId', validateObjectId, getUserProfile);

// Update current user profile
profileRouter.patch('/update', updateProfile);

// Search users
profileRouter.get('/search', searchUsers);

// Get suggested connections
profileRouter.get('/suggestions', getSuggestedConnections);

module.exports = profileRouter;
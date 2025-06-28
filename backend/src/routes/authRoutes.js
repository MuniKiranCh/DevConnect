const express = require('express');
const authRouter = express.Router();
const { register, login, getProfile } = require('../controllers/authController');
const { userAuth } = require('../middlewares/authMiddleware');

// Public routes
authRouter.post('/register', register);
authRouter.post('/login', login);

// Protected routes
authRouter.get('/profile', userAuth, getProfile);

module.exports = authRouter;
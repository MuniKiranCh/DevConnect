const jwt = require('jsonwebtoken');
const User = require('../models/userModel');

// Middleware to verify JWT token
const userAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).send('Authorization header missing or invalid');
        }
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId);
        if (!user) {
            return res.status(401).send('User not found');
        }
        
        // Check if password version matches (invalidates tokens after password change)
        if (decoded.passwordVersion !== undefined && decoded.passwordVersion !== user.passwordVersion) {
            return res.status(401).send('Token invalidated due to password change. Please login again.');
        }
        
        req.user = user;
        req.token = token;
        next();
    } catch (error) {
        return res.status(401).send('Authentication failed');
    }
};

module.exports = { userAuth };
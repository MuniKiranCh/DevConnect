const express=require('express');
const authRouter=express.Router();
const User=require('../models/userModel');
const bcrypt=require('bcrypt');
const { validateSignUpData } = require('../utils/validation');

// Public routes
authRouter.post('/signup', async (req, res) => {
    try {
        validateSignUpData(req);
        const { firstName, lastName, emailId, password, age, gender, photoUrl, skills } = req.body;
        
        // Only firstName, emailId, and password are required
        if (!firstName || !emailId || !password) {
            return res.status(400).json({ 
                error: 'Missing required fields',
                details: 'firstName, emailId, and password are required'
            });
        }
        
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({
            firstName,
            lastName: lastName || "",
            emailId,
            password: hashedPassword,
            age: age || null,
            gender: gender || null,
            photoUrl: photoUrl || undefined, // Will use default from schema
            skills: skills || []
        });
        await user.save();
        return res.status(201).json({ 
            message: 'User registered successfully',
            userId: user._id,
            note: 'Complete your profile to get better matches!'
        });
    } catch (error) {
        console.error('Registration error:', error);
        return res.status(500).json({
            error: 'Registration failed',
            details: error.message
        });
    }
});

authRouter.post('/login', async (req, res) => {
    try {
        const { emailId, password } = req.body;
        const user = await User.findOne({ emailId });
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        const isPasswordCorrect = await bcrypt.compare(password, user.password);
        if (isPasswordCorrect) {
            const token = await user.getJWT();
            return res.status(200).json({
                message: 'Login successful',
                token
            });
        } else {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({
            error: 'Login failed',
            details: error.message
        });
    }
});

// Logout
authRouter.post('/logout', async (req, res) => {
    try {
        // Simply send success response
        // Frontend will handle clearing the token from localStorage
        return res.status(200).json({ message: 'Logged out successfully' });
    } catch (error) {
        console.error('Logout error:', error);
        return res.status(500).json({ error: 'Logout failed' });
    }
});

module.exports=authRouter;
const express=require('express');
const authRouter=express.Router();

const validationSignup = require('../utils/validation');
const User = require('../models/user');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// User Signup Route
authRouter.post('/signup', async (req, res) => {
    try {
        const { firstName, lastName, emailId, password } = req.body;

        // Validate signup request
        validationSignup(req);

        // Hash the password
        const hashPassword = await bcrypt.hash(password, 10);

        // Create and save the new user
        const user = new User({ firstName, lastName, emailId, password: hashPassword });
        await user.save();

        res.status(201).send('User added successfully!');
    } catch (err) {
        res.status(400).send(`ERROR: ${err.message}`);
    }
});

// User Login Route
authRouter.post('/login', async (req, res) => {
    try {
        const { emailId, password } = req.body;

        // Check if the user exists
        const user = await User.findOne({ emailId });
        if (!user) throw new Error("Invalid credentials!");

        // Compare password
        const isPasswordValid = await user.validatePassword(password);

        if (!isPasswordValid) throw new Error("Invalid credentials!");

        // Generate JWT token
        const token = await jwt.sign({ _id: user._id }, 'SECRET_KEY');

        // Set token in cookies
        res.cookie("token", token);
        res.send('Login Successful!!!');
    } catch (err) {
        res.status(400).send(`ERROR: ${err.message}`);
    }
});


module.exports=authRouter;
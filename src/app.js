// Import necessary modules
const express = require('express');
const { connectDB } = require('./config/database');
const User = require('./models/user');
const adminAuth = require('./middlewares/auth');
const validationSignup = require('./utils/validation');
const bcrypt = require('bcrypt');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');

// Initialize the express application
const app = express();

// Middleware
app.use('/admin', adminAuth); // Admin authentication middleware
app.use(express.json()); // Parse incoming JSON requests
app.use(cookieParser()); // Cookie parsing middleware

// User Signup Route
app.post('/signup', async (req, res) => {
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
app.post('/login', async (req, res) => {
    try {
        const { emailId, password } = req.body;

        // Check if the user exists
        const user = await User.findOne({ emailId });
        if (!user) throw new Error("Invalid credentials!");

        // Compare password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) throw new Error("Invalid credentials!");

        // Generate JWT token
        const token = jwt.sign({ _id: user._id }, 'SECRET_KEY');

        // Set token in cookies
        res.cookie("token", token);
        res.send('Login Successful!!!');
    } catch (err) {
        res.status(400).send(`ERROR: ${err.message}`);
    }
});

// Get User Profile Route
app.get('/profile', async (req, res) => {
    try {
        const { token } = req.cookies;

        // Check if token is present
        if (!token) throw new Error("Please login first!");

        // Verify JWT
        const decoded = jwt.verify(token, 'SECRET_KEY');
        const user = await User.findById(decoded._id);

        if (!user) throw new Error("User not found!");

        res.send(user);
    } catch (err) {
        res.status(400).send(`ERROR: ${err.message}`);
    }
});

// Get User by Email Route
app.get('/user', async (req, res) => {
    const { emailId } = req.body;

    try {
        const user = await User.findOne({ emailId });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.send(user);
    } catch (err) {
        res.status(400).send('Something went wrong!');
    }
});

// Get Feed Route
app.get('/feed', async (req, res) => {
    // const { emailId } = req.body;

    try {
        const users = await User.find();

        if (users.length === 0) {
            return res.status(404).json({ message: "User not found" });
        }

        res.send(users);
    } catch (err) {
        res.status(400).send('Something went wrong!');
    }
});

// Delete User Route
app.delete('/user', async (req, res) => {
    const { userId } = req.body;

    try {
        await User.findByIdAndDelete(userId);
        res.send('User deleted successfully!');
    } catch (err) {
        res.status(400).send('Something went wrong!');
    }
});

// Update User Route
app.patch('/user', async (req, res) => {
    const { userId, ...data } = req.body;

    try {
        await User.findByIdAndUpdate(userId, data);
        res.send('User updated successfully!');
    } catch (err) {
        res.status(400).send('Something went wrong!');
    }
});

// Global Error Handling Middleware
app.use('/', (err, req, res, next) => {
    if (err) {
        res.status(500).send('Internal server error');
    } else {
        next();
    }
});

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

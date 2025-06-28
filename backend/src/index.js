const express = require('express');
const connectDB = require('./config/database');
const app = express();

require('dotenv').config();
app.use(express.json());

const port = process.env.PORT || 3000;

const authRouter=require('./routes/authRoutes');
const profileRouter=require('./routes/profileRoutes');
const requestRouter=require('./routes/requestRouter');

app.use('/api/auth',authRouter);
app.use('/api/profile',profileRouter);
app.use('/api/request',requestRouter);

// Fix: Call connectDB as an async function
const startServer = async () => {
    try {
        await connectDB();
        console.log('Database connected successfully');
        app.listen(port, () => {
            console.log(`Server is running on PORT ${port}`);
        });
    } catch (error) {
        console.error('Database connection error:', error);
        process.exit(1);
    }
};

startServer();

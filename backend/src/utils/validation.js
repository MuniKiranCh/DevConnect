const validator = require("validator");
const mongoose = require('mongoose');

// Validate email format
const validateEmail = (email) => {
    return validator.isEmail(email);
};

// Validate password strength
const validatePassword = (password) => {
    return validator.isStrongPassword(password, {
        minLength: 8,
        minLowercase: 1,
        minUppercase: 1,
        minNumbers: 1,
        minSymbols: 1
    });
};

// Validate MongoDB ObjectId
const validateObjectId = (req, res, next) => {
    const paramNames = ['userId', 'receiverId', 'requestId', 'messageId', 'callId'];
    let invalidId = null;
    
    for (const paramName of paramNames) {
        if (req.params[paramName] && !mongoose.Types.ObjectId.isValid(req.params[paramName])) {
            invalidId = paramName;
            break;
        }
    }
    
    if (invalidId) {
        return res.status(400).json({ message: `Invalid ${invalidId} format` });
    }
    next();
};

// Validate signup data
const validateSignUpData = (req) => {
    const { firstName, email, password, age, gender } = req.body;

    // Required fields validation
    if (!firstName) {
        throw new Error("First name is required");
    }
    if (!email) {
        throw new Error("Email is required");
    }
    if (!validateEmail(email)) {
        throw new Error("Invalid email");
    }
    if (!password) {
        throw new Error("Password is required");
    }
    if (!validatePassword(password)) {
        throw new Error("Password is not strong enough");
    }
    
    // Optional fields validation (only if provided)
    if (age !== undefined && age !== null) {
        if (age < 15) {
            throw new Error("Age must be at least 15");
        }
    }
    if (gender !== undefined && gender !== null) {
        if (!["male", "female", "others"].includes(gender)) {
            throw new Error("Invalid gender value");
        }
    }
};

// Validate profile update data
const validateProfileUpdate = (req) => {
    const ALLOWED_UPDATES = ['firstName', 'lastName', 'bio', 'skills', 'location', 'website', 'avatar'];
    const isValidUpdate = Object.keys(req.body).every(field => ALLOWED_UPDATES.includes(field));
    if (!isValidUpdate) {
        return false;
    }

    // Validate skills array length
    if (req.body?.skills && req.body.skills.length > 10) {
        return false;
    }
    
    // Validate website URL if provided
    if (req.body?.website && !validator.isURL(req.body.website)) {
        return false;
    }
    
    return true;
};

// Validate message data
const validateMessageData = (req) => {
    const { content, type } = req.body;
    
    if (!content || content.trim().length === 0) {
        throw new Error("Message content is required");
    }
    
    if (content.length > 1000) {
        throw new Error("Message content too long (max 1000 characters)");
    }
    
    if (type && !['text', 'image', 'file'].includes(type)) {
        throw new Error("Invalid message type");
    }
    
    return true;
};

// Validate call data
const validateCallData = (req) => {
    const { callType } = req.body;
    
    if (callType && !['video', 'audio'].includes(callType)) {
        throw new Error("Invalid call type");
    }
    
    return true;
};

module.exports = { 
    validateEmail, 
    validatePassword, 
    validateObjectId, 
    validateSignUpData, 
    validateProfileUpdate,
    validateMessageData,
    validateCallData
};
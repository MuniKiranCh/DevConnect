const validator = require("validator");
const mongoose = require('mongoose');

const validateSignUpData = (req) => {
    const { firstName, emailId, password, age, gender } = req.body;

    // Required fields validation
    if (!firstName) {
        throw new Error("First name is required");
    }
    if (!emailId) {
        throw new Error("Email is required");
    }
    if (!validator.isEmail(emailId)) {
        throw new Error("Invalid email");
    }
    if (!password) {
        throw new Error("Password is required");
    }
    if (!validator.isStrongPassword(password)) {
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

const validateProfileUpdate = (req) => {
    const ALLOWED_UPDATES = ['firstName', 'lastName', 'photoUrl', 'about', 'skills', 'age', 'gender'];
    const isValidUpdate = Object.keys(req.body).every(field => ALLOWED_UPDATES.includes(field));
    if (!isValidUpdate) {
        return false;
    }

    // Validate skills array length
    if (req.body?.skills && req.body.skills.length > 10) {
        return false;
    }
    
    // Validate age if provided
    if (req.body?.age && (req.body.age < 15 || req.body.age > 100)) {
        return false;
    }
    
    // Validate gender if provided
    if (req.body?.gender && !['male', 'female', 'others'].includes(req.body.gender)) {
        return false;
    }
    
    return true;
};

// Validate MongoDB ObjectId
const validateObjectId = (req, res, next) => {
    const { toUserId, requestId } = req.params;
    const idToValidate = toUserId || requestId;
    
    if (!mongoose.Types.ObjectId.isValid(idToValidate)) {
        return res.status(400).json({ message: 'Invalid ID format' });
    }
    next();
};

module.exports = { validateSignUpData, validateProfileUpdate, validateObjectId };
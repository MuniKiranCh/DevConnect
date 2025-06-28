const express = require('express');
const profileRouter = express.Router();
const User = require('../models/userModel');
const { userAuth } = require('../middlewares/authMiddleware');
const { validateProfileUpdate } = require('../utils/validation');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

// Apply authentication middleware to all routes except password reset
profileRouter.use((req, res, next) => {
    // Skip authentication for password reset requests
    if (req.path.startsWith('/password/reset')) {
        return next();
    }
    return userAuth(req, res, next);
});

// Get user profile
profileRouter.get('/view', async (req, res) => {
    try {
        // No need to query database again since req.user already has the user data
        const userWithoutPassword = { ...req.user.toObject() };
        delete userWithoutPassword.password;
        return res.status(200).json(userWithoutPassword);
    } catch (error) {
        console.error('Profile view error:', error);
        return res.status(500).json({ message: 'Error fetching user profile' });
    }
});

// Get user feed
profileRouter.get('/feed', async (req, res) => {
    try {
        // Exclude the current user and sensitive information from the feed
        const users = await User.find({ _id: { $ne: req.user._id } })
            .select('-password')  // Exclude password field
            .lean();  // Convert to plain JavaScript objects
        return res.status(200).json(users);
    } catch (error) {
        console.error('Feed error:', error);
        return res.status(500).json({ message: 'Error fetching users feed' });
    }
});

// Delete user
profileRouter.delete('/delete', async (req, res) => {
    try {
        // Only allow users to delete their own account
        const user = await User.findByIdAndDelete(req.user._id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        return res.status(200).json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error('Delete user error:', error);
        return res.status(500).json({ message: 'Error deleting user' });
    }
});

// Update user profile
profileRouter.patch('/edit', async (req, res) => {
    try {
        // Validate update fields
        if (!validateProfileUpdate(req)) {
            return res.status(400).json({ message: 'Invalid update fields' });
        }

        const user = await User.findByIdAndUpdate(
            req.user._id,
            req.body,
            {
                new: true,  // Return the updated document
                runValidators: true,
                select: '-password'  // Exclude password from the returned document
            }
        );
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        return res.status(200).json({
            message: `${user.firstName}, your profile updated successfully`,
            data: user
        });
    } catch (error) {
        console.error('Profile update error:', error);
        return res.status(500).json({ message: 'Error updating user profile' });
    }
});

// Change password (auth required)
profileRouter.post('/password/change', async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ message: 'Current password and new password are required' });
        }

        // Password validation
        if (newPassword.length < 6) {
            return res.status(400).json({ message: 'New password must be at least 6 characters long' });
        }

        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Verify current password
        const isValidPassword = await bcrypt.compare(currentPassword, user.password);
        if (!isValidPassword) {
            return res.status(400).json({ message: 'Current password is incorrect' });
        }

        // Hash and update new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;
        user.passwordVersion += 1; // Increment to invalidate existing tokens
        await user.save();

        return res.status(200).json({ 
            message: 'Password changed successfully. Please login again with your new password.',
            note: 'Your current session has been invalidated for security reasons.'
        });
    } catch (error) {
        console.error('Password change error:', error);
        return res.status(500).json({ message: 'Error changing password' });
    }
});

// Request password reset (no auth required)
profileRouter.post('/password/reset/request', async (req, res) => {
    try {
        const { emailId } = req.body;
        
        if (!emailId) {
            return res.status(400).json({ message: 'Email is required' });
        }

        const user = await User.findOne({ emailId });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Generate reset token
        const resetToken = user.getResetPasswordToken();
        await user.save();

        // In a real application, you would send this token via email
        // For development, we'll return it in response
        return res.status(200).json({ 
            message: 'Password reset token generated successfully',
            resetToken: resetToken, // Remove this in production
            emailId: user.emailId
        });
    } catch (error) {
        console.error('Password reset request error:', error);
        return res.status(500).json({ message: 'Error generating reset token' });
    }
});

// Reset password with token (no auth required)
profileRouter.post('/password/reset/reset', async (req, res) => {
    try {
        const { resetToken, newPassword } = req.body;

        if (!resetToken || !newPassword) {
            return res.status(400).json({ message: 'Reset token and new password are required' });
        }

        // Password validation
        if (newPassword.length < 6) {
            return res.status(400).json({ message: 'New password must be at least 6 characters long' });
        }

        // Hash the token to compare with stored hash
        const hashedToken = crypto
            .createHash('sha256')
            .update(resetToken)
            .digest('hex');

        // Find user with valid reset token
        const user = await User.findOne({
            resetPasswordToken: hashedToken,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ message: 'Invalid or expired reset token' });
        }

        // Hash and update new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;
        user.passwordVersion += 1; // Increment to invalidate existing tokens
        
        // Clear reset token fields
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        
        await user.save();

        return res.status(200).json({ message: 'Password reset successfully' });
    } catch (error) {
        console.error('Password reset error:', error);
        return res.status(500).json({ message: 'Error resetting password' });
    }
});

module.exports = profileRouter;
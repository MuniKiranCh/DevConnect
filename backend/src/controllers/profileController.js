const User = require('../models/userModel');
const { validateEmail } = require('../utils/validation');

// Get user profile by ID
const getUserProfile = async (req, res) => {
    try {
        const { userId } = req.params;

        const user = await User.findById(userId)
            .select('-password -email')
            .populate('skills');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        return res.status(200).json({
            user
        });
    } catch (error) {
        console.error('Get user profile error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

// Update user profile
const updateProfile = async (req, res) => {
    try {
        const { firstName, lastName, bio, skills, location, website, github, linkedin, photoUrl } = req.body;

        // Validation
        if (email && !validateEmail(email)) {
            return res.status(400).json({ message: 'Invalid email format' });
        }

        const updateData = {};
        if (firstName) updateData.firstName = firstName;
        if (lastName) updateData.lastName = lastName;
        if (bio !== undefined) updateData.bio = bio;
        if (skills) updateData.skills = skills;
        if (location) updateData.location = location;
        if (website) updateData.website = website;
        if (github) updateData.github = github;
        if (linkedin) updateData.linkedin = linkedin;
        if (photoUrl) updateData.photoUrl = photoUrl;

        const updatedUser = await User.findByIdAndUpdate(
            req.user._id,
            updateData,
            { new: true, runValidators: true }
        ).select('-password');

        if (!updatedUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        return res.status(200).json({
            message: 'Profile updated successfully',
            user: updatedUser
        });
    } catch (error) {
        console.error('Update profile error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

// Search users
const searchUsers = async (req, res) => {
    try {
        const { q, skills, location, page = 1, limit = 20 } = req.query;
        const skip = (page - 1) * limit;

        let query = { _id: { $ne: req.user._id } }; // Exclude current user

        // Text search
        if (q) {
            query.$or = [
                { firstName: { $regex: q, $options: 'i' } },
                { lastName: { $regex: q, $options: 'i' } },
                { bio: { $regex: q, $options: 'i' } }
            ];
        }

        // Skills filter
        if (skills) {
            const skillsArray = skills.split(',').map(skill => skill.trim());
            query.skills = { $in: skillsArray };
        }

        // Location filter
        if (location) {
            query.location = { $regex: location, $options: 'i' };
        }

        const users = await User.find(query)
            .select('-password -email')
            .populate('skills')
            .sort({ firstName: 1, lastName: 1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await User.countDocuments(query);

        return res.status(200).json({
            users,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Search users error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

// Get suggested connections
const getSuggestedConnections = async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const skip = (page - 1) * limit;

        // Get user's current connections
        const userConnections = await User.findById(req.user._id)
            .populate({
                path: 'connections',
                select: '_id'
            });

        const connectedUserIds = userConnections.connections.map(conn => conn._id);
        connectedUserIds.push(req.user._id); // Exclude self

        // Find users not connected
        const suggestedUsers = await User.find({
            _id: { $nin: connectedUserIds }
        })
        .select('-password -email')
        .populate('skills')
        .sort({ firstName: 1, lastName: 1 })
        .skip(skip)
        .limit(parseInt(limit));

        return res.status(200).json({
            suggestedUsers,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                hasMore: suggestedUsers.length === parseInt(limit)
            }
        });
    } catch (error) {
        console.error('Get suggested connections error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

module.exports = {
    getUserProfile,
    updateProfile,
    searchUsers,
    getSuggestedConnections
}; 
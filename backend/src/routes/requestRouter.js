const express = require('express');
const requestRouter = express.Router();
const User = require('../models/userModel');
const Request = require('../models/requestModel');
const { userAuth } = require('../middlewares/authMiddleware');
const { validateObjectId } = require('../utils/validation');
const mongoose = require('mongoose');

// Request status constants
const REQUEST_STATUS = {
    INTERESTED: 'interested',  // Pending connection request
    DECLINED: 'declined',      // User declined to connect
    ACCEPTED: 'accepted',      // Connection established
    REJECTED: 'rejected'       // Incoming request rejected
    
    // LinkedIn-style alternative (for future consideration):
    // PENDING: 'pending',     // Request sent, waiting for response
    // ACCEPTED: 'accepted',   // Connection established
    // REJECTED: 'rejected',   // Rejected (private - sender doesn't know)
    // IGNORED: 'ignored'      // Ignored (private - sender doesn't know)
};

// Apply authentication middleware to all routes
requestRouter.use(userAuth);

// Send interested request
requestRouter.post('/send/interested/:toUserId', validateObjectId, async (req, res) => {
    try {
        const { toUserId } = req.params;
        
        // Prevent self-interaction
        if (toUserId === req.user._id.toString()) {
            return res.status(400).json({ message: 'Cannot send request to yourself' });
        }
        
        // Check if user exists
        const targetUser = await User.findById(toUserId);
        if (!targetUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check for existing interactions
        const existingInteraction = await Request.findOne({
            $or: [
                { sender: req.user._id, receiver: toUserId },
                { sender: toUserId, receiver: req.user._id }
            ]
        });

        // If there's already a request in the same direction, prevent duplicate
        if (existingInteraction && 
            existingInteraction.sender.toString() === req.user._id.toString() && 
            existingInteraction.receiver.toString() === toUserId) {
            return res.status(400).json({ message: 'You have already sent a request to this user' });
        }

        // If there's already an "accepted", "rejected", or "declined" request, prevent new requests
        if (existingInteraction && 
            (existingInteraction.status === REQUEST_STATUS.ACCEPTED || 
             existingInteraction.status === REQUEST_STATUS.REJECTED ||
             existingInteraction.status === REQUEST_STATUS.DECLINED)) {
            return res.status(400).json({ message: 'Connection request already processed' });
        }

        // Create new connection request
        const interaction = await Request.create({
            sender: req.user._id,
            receiver: toUserId,
            status: REQUEST_STATUS.INTERESTED
        });

        return res.status(201).json({ 
            message: 'Connection request sent successfully',
            requestId: interaction._id
        });
    } catch (error) {
        console.error('Connection request error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
});

// Send declined request
requestRouter.post('/send/declined/:toUserId', validateObjectId, async (req, res) => {
    try {
        const { toUserId } = req.params;
        
        // Prevent self-interaction
        if (toUserId === req.user._id.toString()) {
            return res.status(400).json({ message: 'Cannot decline yourself' });
        }

        // Check if user exists
        const targetUser = await User.findById(toUserId);
        if (!targetUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check for existing interactions
        const existingInteraction = await Request.findOne({
            $or: [
                { sender: req.user._id, receiver: toUserId },
                { sender: toUserId, receiver: req.user._id }
            ]
        });

        // If there's already a "declined" request in the same direction, prevent duplicate
        if (existingInteraction && 
            existingInteraction.sender.toString() === req.user._id.toString() && 
            existingInteraction.receiver.toString() === toUserId &&
            existingInteraction.status === REQUEST_STATUS.DECLINED) {
            return res.status(400).json({ message: 'You have already declined this user' });
        }

        // If there's already an "accepted", "rejected", or "declined" request, prevent new requests
        if (existingInteraction && 
            (existingInteraction.status === REQUEST_STATUS.ACCEPTED || 
             existingInteraction.status === REQUEST_STATUS.REJECTED ||
             existingInteraction.status === REQUEST_STATUS.DECLINED)) {
            return res.status(400).json({ message: 'Connection request already processed' });
        }

        // If there's an existing "interested" request from the current user, update it to "declined"
        if (existingInteraction && 
            existingInteraction.sender.toString() === req.user._id.toString() && 
            existingInteraction.receiver.toString() === toUserId &&
            existingInteraction.status === REQUEST_STATUS.INTERESTED) {
            existingInteraction.status = REQUEST_STATUS.DECLINED;
            await existingInteraction.save();
            return res.status(200).json({ message: 'Connection request updated to declined' });
        }

        // Create new declined interaction
        await Request.create({
            sender: req.user._id,
            receiver: toUserId,
            status: REQUEST_STATUS.DECLINED
        });

        return res.status(201).json({ message: 'User declined successfully' });
    } catch (error) {
        console.error('Connection request error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
});

// Review and accept request
requestRouter.post('/review/accepted/:requestId', validateObjectId, async (req, res) => {
    try {
        const { requestId } = req.params;
        
        const request = await Request.findById(requestId);
        if (!request) {
            return res.status(404).json({ message: 'Request not found' });
        }

        if (request.receiver.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to review this request' });
        }

        if (request.status !== REQUEST_STATUS.INTERESTED) {
            return res.status(400).json({ message: 'Can only accept interested requests' });
        }

        request.status = REQUEST_STATUS.ACCEPTED;
        await request.save();

        return res.status(200).json({ message: 'Request accepted successfully' });
    } catch (error) {
        console.error('Review error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
});

// Review and reject request
requestRouter.post('/review/rejected/:requestId', validateObjectId, async (req, res) => {
    try {
        const { requestId } = req.params;
        
        const request = await Request.findById(requestId);
        if (!request) {
            return res.status(404).json({ message: 'Request not found' });
        }

        if (request.receiver.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to review this request' });
        }

        if (request.status !== REQUEST_STATUS.INTERESTED) {
            return res.status(400).json({ message: 'Can only reject interested requests' });
        }

        request.status = REQUEST_STATUS.REJECTED;
        await request.save();

        return res.status(200).json({ message: 'Request rejected successfully' });
    } catch (error) {
        console.error('Review error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
});

// Get user matches
requestRouter.get('/matches', async (req, res) => {
    try {
        const matches = await Request.find({
            $or: [
                { sender: req.user._id },
                { receiver: req.user._id }
            ],
            status: REQUEST_STATUS.ACCEPTED
        }).populate('sender receiver', 'firstName lastName photoUrl');

        return res.status(200).json({ matches });
    } catch (error) {
        console.error('Fetch matches error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
});

// Get interested requests
requestRouter.get('/interested-requests', async (req, res) => {
    try {
        const interestedRequests = await Request.find({
            receiver: req.user._id,
            status: REQUEST_STATUS.INTERESTED
        }).populate('sender', 'firstName lastName photoUrl');

        return res.status(200).json({ 
            interestedRequests,
            count: interestedRequests.length,
            userId: req.user._id
        });
    } catch (error) {
        console.error('Fetch interested requests error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
});

// Get all user interactions
requestRouter.get('/interactions', async (req, res) => {
    try {
        const interactions = await Request.find({
            $or: [
                { sender: req.user._id },
                { receiver: req.user._id }
            ]
        }).populate('sender receiver', 'firstName lastName photoUrl');

        return res.status(200).json({ interactions });
    } catch (error) {
        console.error('Fetch interactions error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
});

module.exports = requestRouter;
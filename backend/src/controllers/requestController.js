const Request = require('../models/requestModel');
const User = require('../models/userModel');
const { validateObjectId } = require('../utils/validation');

// Helper function to check if users are connected
const checkConnection = async (user1Id, user2Id) => {
    const connection = await Request.findOne({
        $or: [
            { sender: user1Id, receiver: user2Id },
            { sender: user2Id, receiver: user1Id }
        ],
        status: 'accepted'
    });
    return connection !== null;
};

// Send connection request
const sendRequest = async (req, res) => {
    try {
        const { receiverId } = req.params;

        // Prevent self-request
        if (receiverId === req.user._id.toString()) {
            return res.status(400).json({ message: 'Cannot send request to yourself' });
        }

        // Check if users are already connected
        const areConnected = await checkConnection(req.user._id, receiverId);
        if (areConnected) {
            return res.status(400).json({ message: 'Users are already connected' });
        }

        // Check if request already exists
        const existingRequest = await Request.findOne({
            $or: [
                { sender: req.user._id, receiver: receiverId },
                { sender: receiverId, receiver: req.user._id }
            ]
        });

        if (existingRequest) {
            return res.status(400).json({ message: 'Connection request already exists' });
        }

        // Create request
        const request = await Request.create({
            sender: req.user._id,
            receiver: receiverId
        });

        await request.populate('sender receiver', 'firstName lastName photoUrl');

        return res.status(201).json({
            message: 'Connection request sent successfully',
            request
        });
    } catch (error) {
        console.error('Send request error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

// Accept connection request
const acceptRequest = async (req, res) => {
    try {
        const { requestId } = req.params;

        const request = await Request.findById(requestId);
        if (!request) {
            return res.status(404).json({ message: 'Request not found' });
        }

        // Only receiver can accept
        if (request.receiver.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to accept this request' });
        }

        if (request.status !== 'interested') {
            return res.status(400).json({ message: 'Request is not in interested state' });
        }

        request.status = 'accepted';
        await request.save();

        // Add to connections for both users
        await User.findByIdAndUpdate(request.sender, {
            $addToSet: { connections: request.receiver }
        });
        await User.findByIdAndUpdate(request.receiver, {
            $addToSet: { connections: request.sender }
        });

        await request.populate('sender receiver', 'firstName lastName photoUrl');

        return res.status(200).json({
            message: 'Connection request accepted successfully',
            request
        });
    } catch (error) {
        console.error('Accept request error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

// Reject connection request
const rejectRequest = async (req, res) => {
    try {
        const { requestId } = req.params;

        const request = await Request.findById(requestId);
        if (!request) {
            return res.status(404).json({ message: 'Request not found' });
        }

        // Only receiver can reject
        if (request.receiver.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to reject this request' });
        }

        if (request.status !== 'interested') {
            return res.status(400).json({ message: 'Request is not in interested state' });
        }

        request.status = 'rejected';
        await request.save();

        await request.populate('sender receiver', 'firstName lastName photoUrl');

        return res.status(200).json({
            message: 'Connection request rejected successfully',
            request
        });
    } catch (error) {
        console.error('Reject request error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

// Get pending requests
const getPendingRequests = async (req, res) => {
    try {
        const { page = 1, limit = 20 } = req.query;
        const skip = (page - 1) * limit;

        const requests = await Request.find({
            receiver: req.user._id,
            status: 'interested'
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('sender', 'firstName lastName photoUrl bio skills');

        const total = await Request.countDocuments({
            receiver: req.user._id,
            status: 'interested'
        });

        return res.status(200).json({
            requests,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Get pending requests error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

// Get sent requests
const getSentRequests = async (req, res) => {
    try {
        const { page = 1, limit = 20 } = req.query;
        const skip = (page - 1) * limit;

        const requests = await Request.find({
            sender: req.user._id
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('receiver', 'firstName lastName photoUrl bio skills');

        const total = await Request.countDocuments({
            sender: req.user._id
        });

        return res.status(200).json({
            requests,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Get sent requests error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

// Get connections
const getConnections = async (req, res) => {
    try {
        const { page = 1, limit = 20 } = req.query;
        const skip = (page - 1) * limit;

        const user = await User.findById(req.user._id)
            .populate({
                path: 'connections',
                select: 'firstName lastName photoUrl bio skills location',
                options: {
                    skip: skip,
                    limit: parseInt(limit),
                    sort: { firstName: 1, lastName: 1 }
                }
            });

        const total = user.connections.length;

        return res.status(200).json({
            connections: user.connections,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Get connections error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

module.exports = {
    sendRequest,
    acceptRequest,
    rejectRequest,
    getPendingRequests,
    getSentRequests,
    getConnections
}; 
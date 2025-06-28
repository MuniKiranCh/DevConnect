const Call = require('../models/callModel');
const Request = require('../models/requestModel');
const { validateObjectId } = require('../utils/validation');
const { v4: uuidv4 } = require('uuid');

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

// Initiate a call
const initiateCall = async (req, res) => {
    try {
        const { receiverId } = req.params;
        const { callType = 'video' } = req.body;

        // Prevent self-calling
        if (receiverId === req.user._id.toString()) {
            return res.status(400).json({ message: 'Cannot call yourself' });
        }

        // Check if users are connected
        const areConnected = await checkConnection(req.user._id, receiverId);
        if (!areConnected) {
            return res.status(403).json({ message: 'Can only call connected users' });
        }

        // Check if receiver is already in a call
        const existingCall = await Call.findOne({
            $or: [
                { caller: receiverId },
                { receiver: receiverId }
            ],
            status: { $in: ['ringing', 'accepted'] }
        });

        if (existingCall) {
            return res.status(400).json({ message: 'User is currently in a call' });
        }

        // Create call session
        const callId = uuidv4();
        const call = await Call.create({
            caller: req.user._id,
            receiver: receiverId,
            callId,
            callType
        });

        // Populate user details
        await call.populate('caller receiver', 'firstName lastName photoUrl');

        return res.status(201).json({
            message: 'Call initiated successfully',
            data: call
        });
    } catch (error) {
        console.error('Initiate call error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

// Accept a call
const acceptCall = async (req, res) => {
    try {
        const { callId } = req.params;

        const call = await Call.findOne({ callId });
        if (!call) {
            return res.status(404).json({ message: 'Call not found' });
        }

        // Only receiver can accept
        if (call.receiver.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to accept this call' });
        }

        if (call.status !== 'ringing') {
            return res.status(400).json({ message: 'Call is not in ringing state' });
        }

        call.status = 'accepted';
        call.startTime = new Date();
        await call.save();

        await call.populate('caller receiver', 'firstName lastName photoUrl');

        return res.status(200).json({
            message: 'Call accepted successfully',
            data: call
        });
    } catch (error) {
        console.error('Accept call error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

// Decline a call
const declineCall = async (req, res) => {
    try {
        const { callId } = req.params;

        const call = await Call.findOne({ callId });
        if (!call) {
            return res.status(404).json({ message: 'Call not found' });
        }

        // Only receiver can decline
        if (call.receiver.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to decline this call' });
        }

        if (call.status !== 'ringing') {
            return res.status(400).json({ message: 'Call is not in ringing state' });
        }

        call.status = 'declined';
        await call.save();

        await call.populate('caller receiver', 'firstName lastName photoUrl');

        return res.status(200).json({
            message: 'Call declined successfully',
            data: call
        });
    } catch (error) {
        console.error('Decline call error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

// End a call
const endCall = async (req, res) => {
    try {
        const { callId } = req.params;

        const call = await Call.findOne({ callId });
        if (!call) {
            return res.status(404).json({ message: 'Call not found' });
        }

        // Only participants can end the call
        if (call.caller.toString() !== req.user._id.toString() && 
            call.receiver.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to end this call' });
        }

        if (call.status !== 'accepted') {
            return res.status(400).json({ message: 'Call is not active' });
        }

        call.status = 'ended';
        call.endTime = new Date();
        
        // Calculate duration
        if (call.startTime) {
            call.duration = Math.floor((call.endTime - call.startTime) / 1000);
        }

        await call.save();

        await call.populate('caller receiver', 'firstName lastName photoUrl');

        return res.status(200).json({
            message: 'Call ended successfully',
            data: call
        });
    } catch (error) {
        console.error('End call error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

// Get call history
const getCallHistory = async (req, res) => {
    try {
        const { page = 1, limit = 20 } = req.query;
        const skip = (page - 1) * limit;

        const calls = await Call.find({
            $or: [
                { caller: req.user._id },
                { receiver: req.user._id }
            ]
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('caller receiver', 'firstName lastName photoUrl');

        return res.status(200).json({
            calls,
            page: parseInt(page),
            limit: parseInt(limit),
            hasMore: calls.length === parseInt(limit)
        });
    } catch (error) {
        console.error('Get call history error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

// Get call details
const getCallDetails = async (req, res) => {
    try {
        const { callId } = req.params;

        const call = await Call.findOne({ callId })
            .populate('caller receiver', 'firstName lastName photoUrl');

        if (!call) {
            return res.status(404).json({ message: 'Call not found' });
        }

        // Check if user is part of this call
        if (call.caller._id.toString() !== req.user._id.toString() && 
            call.receiver._id.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to view this call' });
        }

        return res.status(200).json({
            call
        });
    } catch (error) {
        console.error('Get call error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

// Store WebRTC offer
const storeOffer = async (req, res) => {
    try {
        const { callId } = req.params;
        const { offer } = req.body;

        const call = await Call.findOne({ callId });
        if (!call) {
            return res.status(404).json({ message: 'Call not found' });
        }

        // Only caller can set offer
        if (call.caller.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to set offer' });
        }

        call.offer = offer;
        await call.save();

        return res.status(200).json({
            message: 'Offer stored successfully'
        });
    } catch (error) {
        console.error('Store offer error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

// Store WebRTC answer
const storeAnswer = async (req, res) => {
    try {
        const { callId } = req.params;
        const { answer } = req.body;

        const call = await Call.findOne({ callId });
        if (!call) {
            return res.status(404).json({ message: 'Call not found' });
        }

        call.answer = answer;
        await call.save();

        return res.status(200).json({
            message: 'Answer stored successfully'
        });
    } catch (error) {
        console.error('Store answer error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

// Store ICE candidate
const storeIceCandidate = async (req, res) => {
    try {
        const { callId } = req.params;
        const { candidate } = req.body;

        const call = await Call.findOne({ callId });
        if (!call) {
            return res.status(404).json({ message: 'Call not found' });
        }

        call.iceCandidates.push({
            candidate,
            from: req.user._id
        });
        await call.save();

        return res.status(200).json({
            message: 'ICE candidate stored successfully'
        });
    } catch (error) {
        console.error('Store ICE candidate error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

module.exports = {
    initiateCall,
    acceptCall,
    declineCall,
    endCall,
    getCallHistory,
    getCallDetails,
    storeOffer,
    storeAnswer,
    storeIceCandidate
}; 
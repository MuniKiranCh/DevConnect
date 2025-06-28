const Message = require('../models/messageModel');
const Request = require('../models/requestModel');
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

// Send message
const sendMessage = async (req, res) => {
    try {
        const { receiverId } = req.params;
        const { content } = req.body;

        if (!content || content.trim().length === 0) {
            return res.status(400).json({ message: 'Message content is required' });
        }

        // Check if users are connected
        const areConnected = await checkConnection(req.user._id, receiverId);
        if (!areConnected) {
            return res.status(403).json({ message: 'Can only message connected users' });
        }

        // Create message
        const message = await Message.create({
            sender: req.user._id,
            receiver: receiverId,
            content: content.trim()
        });

        await message.populate('sender receiver', 'firstName lastName photoUrl');

        return res.status(201).json({
            message: 'Message sent successfully',
            data: message
        });
    } catch (error) {
        console.error('Send message error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

// Get conversation messages
const getConversation = async (req, res) => {
    try {
        const { userId } = req.params;
        const { page = 1, limit = 50 } = req.query;
        const skip = (page - 1) * limit;

        // Check if users are connected
        const areConnected = await checkConnection(req.user._id, userId);
        if (!areConnected) {
            return res.status(403).json({ message: 'Can only view messages with connected users' });
        }

        const messages = await Message.find({
            $or: [
                { sender: req.user._id, receiver: userId },
                { sender: userId, receiver: req.user._id }
            ]
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('sender receiver', 'firstName lastName photoUrl');

        const total = await Message.countDocuments({
            $or: [
                { sender: req.user._id, receiver: userId },
                { sender: userId, receiver: req.user._id }
            ]
        });

        return res.status(200).json({
            messages: messages.reverse(), // Reverse to get chronological order
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Get conversation error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

// Get all conversations (recent messages)
const getConversations = async (req, res) => {
    try {
        const { page = 1, limit = 20 } = req.query;
        const skip = (page - 1) * limit;

        // Get all messages where user is sender or receiver
        const messages = await Message.find({
            $or: [
                { sender: req.user._id },
                { receiver: req.user._id }
            ]
        })
        .sort({ createdAt: -1 })
        .populate('sender receiver', 'firstName lastName photoUrl');

        // Group messages by conversation partner
        const conversations = new Map();
        messages.forEach(message => {
            const partnerId = message.sender._id.toString() === req.user._id.toString() 
                ? message.receiver._id.toString() 
                : message.sender._id.toString();
            
            if (!conversations.has(partnerId)) {
                conversations.set(partnerId, {
                    partner: message.sender._id.toString() === req.user._id.toString() 
                        ? message.receiver 
                        : message.sender,
                    lastMessage: message,
                    unreadCount: 0
                });
            }
        });

        // Convert to array and sort by last message time
        const conversationsArray = Array.from(conversations.values())
            .sort((a, b) => new Date(b.lastMessage.createdAt) - new Date(a.lastMessage.createdAt))
            .slice(skip, skip + parseInt(limit));

        return res.status(200).json({
            conversations: conversationsArray,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                hasMore: conversationsArray.length === parseInt(limit)
            }
        });
    } catch (error) {
        console.error('Get conversations error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

// Mark messages as read
const markAsRead = async (req, res) => {
    try {
        const { userId } = req.params;

        // Check if users are connected
        const areConnected = await checkConnection(req.user._id, userId);
        if (!areConnected) {
            return res.status(403).json({ message: 'Can only mark messages from connected users as read' });
        }

        // Mark all unread messages from this user as read
        const result = await Message.updateMany(
            {
                sender: userId,
                receiver: req.user._id,
                read: false
            },
            {
                read: true,
                readAt: new Date()
            }
        );

        return res.status(200).json({
            message: 'Messages marked as read successfully',
            updatedCount: result.modifiedCount
        });
    } catch (error) {
        console.error('Mark as read error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

// Delete message
const deleteMessage = async (req, res) => {
    try {
        const { messageId } = req.params;

        const message = await Message.findById(messageId);
        if (!message) {
            return res.status(404).json({ message: 'Message not found' });
        }

        // Only sender can delete message
        if (message.sender.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to delete this message' });
        }

        await Message.findByIdAndDelete(messageId);

        return res.status(200).json({
            message: 'Message deleted successfully'
        });
    } catch (error) {
        console.error('Delete message error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

module.exports = {
    sendMessage,
    getConversation,
    getConversations,
    markAsRead,
    deleteMessage
}; 
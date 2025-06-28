const express = require('express');
const messageRouter = express.Router();
const { sendMessage, getConversation, getConversations, markAsRead, deleteMessage } = require('../controllers/messageController');
const { userAuth } = require('../middlewares/authMiddleware');
const { validateObjectId } = require('../utils/validation');

// Apply authentication middleware to all routes
messageRouter.use(userAuth);

// Send message to connected user
messageRouter.post('/send/:receiverId', validateObjectId, sendMessage);

// Get conversation with a specific user
messageRouter.get('/conversation/:userId', validateObjectId, getConversation);

// Get all conversations
messageRouter.get('/conversations', getConversations);

// Mark messages as read
messageRouter.patch('/read/:userId', validateObjectId, markAsRead);

// Delete a message
messageRouter.delete('/:messageId', validateObjectId, deleteMessage);

module.exports = messageRouter; 
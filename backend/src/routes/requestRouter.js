const express = require('express');
const requestRouter = express.Router();
const { sendRequest, acceptRequest, rejectRequest, getPendingRequests, getSentRequests, getConnections } = require('../controllers/requestController');
const { userAuth } = require('../middlewares/authMiddleware');
const { validateObjectId } = require('../utils/validation');

// Apply authentication middleware to all routes
requestRouter.use(userAuth);

// Send connection request
requestRouter.post('/send/:receiverId', validateObjectId, sendRequest);

// Accept connection request
requestRouter.patch('/accept/:requestId', validateObjectId, acceptRequest);

// Reject connection request
requestRouter.patch('/reject/:requestId', validateObjectId, rejectRequest);

// Get pending requests
requestRouter.get('/pending', getPendingRequests);

// Get sent requests
requestRouter.get('/sent', getSentRequests);

// Get connections
requestRouter.get('/connections', getConnections);

module.exports = requestRouter;
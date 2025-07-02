const express = require('express');
const callRouter = express.Router();
const { initiateCall, acceptCall, declineCall, endCall, getCallHistory, getCallDetails, storeOffer, storeAnswer, storeIceCandidate } = require('../controllers/callController');
const { userAuth } = require('../middlewares/authMiddleware');
const { validateObjectId } = require('../utils/validation');

// Apply authentication middleware to all routes
callRouter.use(userAuth);

// Initiate a call
callRouter.post('/initiate/:receiverId', validateObjectId, initiateCall);

// Accept a call
callRouter.patch('/accept/:callId', acceptCall);

// Decline a call
callRouter.patch('/decline/:callId', declineCall);

// End a call
callRouter.patch('/end/:callId', endCall);

// Get call history
callRouter.get('/history', getCallHistory);

// Get call details
callRouter.get('/:callId', getCallDetails);

// WebRTC signaling routes
callRouter.post('/:callId/offer', validateObjectId, storeOffer);
callRouter.post('/:callId/answer', validateObjectId, storeAnswer);
callRouter.post('/:callId/ice-candidate', validateObjectId, storeIceCandidate);

module.exports = callRouter; 
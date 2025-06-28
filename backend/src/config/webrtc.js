// WebRTC Configuration with STUN/TURN servers
const webrtcConfig = {
    // STUN servers (free, for basic connectivity)
    iceServers: [
        {
            urls: [
                'stun:stun.l.google.com:19302',
                'stun:stun1.l.google.com:19302',
                'stun:stun2.l.google.com:19302',
                'stun:stun3.l.google.com:19302',
                'stun:stun4.l.google.com:19302'
            ]
        },
        // TURN servers (for NAT traversal when STUN fails)
        // In production, you should use your own TURN servers
        {
            urls: [
                'turn:openrelay.metered.ca:80',
                'turn:openrelay.metered.ca:443',
                'turn:openrelay.metered.ca:443?transport=tcp'
            ],
            username: 'openrelayproject',
            credential: 'openrelayproject'
        }
    ],
    
    // ICE candidate configuration
    iceCandidatePoolSize: 10,
    
    // Media constraints for video calls
    mediaConstraints: {
        audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
        },
        video: {
            width: { ideal: 1280, max: 1920 },
            height: { ideal: 720, max: 1080 },
            frameRate: { ideal: 30, max: 60 }
        }
    },
    
    // Screen sharing constraints
    screenShareConstraints: {
        video: {
            cursor: 'always',
            displaySurface: 'monitor'
        }
    }
};

// WebRTC connection states
const connectionStates = {
    NEW: 'new',
    CONNECTING: 'connecting',
    CONNECTED: 'connected',
    DISCONNECTED: 'disconnected',
    FAILED: 'failed',
    CLOSED: 'closed'
};

// Call states
const callStates = {
    RINGING: 'ringing',
    ACCEPTED: 'accepted',
    DECLINED: 'declined',
    ENDED: 'ended',
    MISSED: 'missed'
};

// Socket.io events for WebRTC signaling
const socketEvents = {
    // Call management
    INITIATE_CALL: 'initiate_call',
    INCOMING_CALL: 'incoming_call',
    ACCEPT_CALL: 'accept_call',
    DECLINE_CALL: 'decline_call',
    END_CALL: 'end_call',
    CALL_ACCEPTED: 'call_accepted',
    CALL_DECLINED: 'call_declined',
    CALL_ENDED: 'call_ended',
    
    // WebRTC signaling
    WEBRTC_OFFER: 'webrtc_offer',
    WEBRTC_ANSWER: 'webrtc_answer',
    ICE_CANDIDATE: 'ice_candidate',
    
    // User management
    JOIN: 'join',
    DISCONNECT: 'disconnect'
};

module.exports = {
    webrtcConfig,
    connectionStates,
    callStates,
    socketEvents
}; 
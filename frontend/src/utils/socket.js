import { io } from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.eventListeners = new Map();
  }

  connect(token) {
    if (this.socket && this.isConnected) {
      return this.socket;
    }

    this.socket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000', {
      auth: {
        token,
      },
      transports: ['websocket', 'polling'],
    });

    this.socket.on('connect', () => {
      console.log('Connected to Socket.IO server');
      this.isConnected = true;
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from Socket.IO server');
      this.isConnected = false;
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      this.isConnected = false;
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  join(userId) {
    if (this.socket && this.isConnected) {
      this.socket.emit('join', userId);
    }
  }

  // Messaging events
  sendMessage(receiverId, message) {
    if (this.socket && this.isConnected) {
      this.socket.emit('send_message', { receiverId, message });
    }
  }

  onNewMessage(callback) {
    if (this.socket) {
      this.socket.on('new_message', callback);
    }
  }

  sendTyping(receiverId, isTyping) {
    if (this.socket && this.isConnected) {
      this.socket.emit('typing', { receiverId, isTyping });
    }
  }

  onUserTyping(callback) {
    if (this.socket) {
      this.socket.on('user_typing', callback);
    }
  }

  // Call events
  initiateCall(receiverId, callType = 'video') {
    if (this.socket && this.isConnected) {
      this.socket.emit('initiate_call', { receiverId, callType });
    }
  }

  onIncomingCall(callback) {
    if (this.socket) {
      this.socket.on('incoming_call', callback);
    }
  }

  acceptCall(callerId, callId) {
    if (this.socket && this.isConnected) {
      this.socket.emit('accept_call', { callerId, callId });
    }
  }

  declineCall(callerId, callId) {
    if (this.socket && this.isConnected) {
      this.socket.emit('decline_call', { callerId, callId });
    }
  }

  endCall(receiverId, callId) {
    if (this.socket && this.isConnected) {
      this.socket.emit('end_call', { receiverId, callId });
    }
  }

  onCallAccepted(callback) {
    if (this.socket) {
      this.socket.on('call_accepted', callback);
    }
  }

  onCallDeclined(callback) {
    if (this.socket) {
      this.socket.on('call_declined', callback);
    }
  }

  onCallEnded(callback) {
    if (this.socket) {
      this.socket.on('call_ended', callback);
    }
  }

  // WebRTC signaling events
  sendWebRTCOffer(receiverId, offer, callId) {
    if (this.socket && this.isConnected) {
      this.socket.emit('webrtc_offer', { receiverId, offer, callId });
    }
  }

  sendWebRTCAnswer(callerId, answer, callId) {
    if (this.socket && this.isConnected) {
      this.socket.emit('webrtc_answer', { callerId, answer, callId });
    }
  }

  sendIceCandidate(receiverId, candidate, callId) {
    if (this.socket && this.isConnected) {
      this.socket.emit('ice_candidate', { receiverId, candidate, callId });
    }
  }

  onWebRTCOffer(callback) {
    if (this.socket) {
      this.socket.on('webrtc_offer', callback);
    }
  }

  onWebRTCAnswer(callback) {
    if (this.socket) {
      this.socket.on('webrtc_answer', callback);
    }
  }

  onIceCandidate(callback) {
    if (this.socket) {
      this.socket.on('ice_candidate', callback);
    }
  }

  // Utility methods
  isConnected() {
    return this.isConnected;
  }

  getSocket() {
    return this.socket;
  }

  // Remove event listeners
  removeListener(event, callback) {
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }

  removeAllListeners(event) {
    if (this.socket) {
      this.socket.off(event);
    }
  }
}

// Create singleton instance
const socketService = new SocketService();
export default socketService; 
import { io } from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.eventListeners = new Map();
    this.currentToken = null;
    this.currentUserId = null;
    this.pendingJoin = null;
  }

  connect(token) {
    // If already connected with the same token, return existing socket
    if (this.socket && this.isConnected && this.currentToken === token) {
      return this.socket;
    }

    // If there's an existing connection, disconnect it first
    if (this.socket) {
      console.log('Disconnecting existing socket before creating new connection');
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }

    console.log('Creating new socket connection with token');
    this.currentToken = token;
    
    // Extract user ID from token (for debugging)
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      this.currentUserId = payload.userId;
      console.log('Extracted user ID from token:', this.currentUserId);
    } catch (error) {
      console.error('Failed to extract user ID from token:', error);
    }

    this.socket = io('http://localhost:3000', {
      auth: {
        token,
      },
      transports: ['websocket', 'polling'],
      forceNew: true, // Force new connection
    });

    this.socket.on('connect', () => {
      console.log('Connected to Socket.IO server');
      this.isConnected = true;
      
      // If there was a pending join, execute it now
      if (this.pendingJoin) {
        console.log('Executing pending join after connection for user:', this.pendingJoin);
        this.socket.emit('join', this.pendingJoin);
        this.pendingJoin = null;
      } else {
        console.log('No pending join to execute');
      }
      
      // Also try to join if we have a current token and user ID
      if (this.currentToken && this.currentUserId) {
        console.log('Attempting to join with current user ID:', this.currentUserId);
        this.socket.emit('join', this.currentUserId);
      }
    });

    this.socket.on('joined_room', (data) => {
      console.log('Successfully joined room:', data);
      console.log('User is now online and ready for calls');
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from Socket.IO server');
      this.isConnected = false;
      
      // Try to reconnect after a short delay
      setTimeout(() => {
        if (this.currentToken && !this.socket.connected) {
          console.log('Attempting to reconnect socket...');
          this.connect(this.currentToken);
        }
      }, 1000);
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      console.error('Error details:', error.message);
      this.isConnected = false;
      
      // If it's an authentication error, try to reconnect
      if (error.message && error.message.includes('Authentication error')) {
        console.error('Authentication failed, token might be invalid');
      }
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      console.log('Disconnecting socket service');
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.currentToken = null;
      this.currentUserId = null;
      this.pendingJoin = null;
    }
  }

  join(userId) {
    console.log(`Join requested for user: ${userId}`);
    console.log(`Socket status:`, { socket: !!this.socket, connected: this.socket?.connected });
    
    if (this.socket && this.socket.connected) {
      console.log(`Joining socket room as user: ${userId}`);
      this.socket.emit('join', userId);
    } else {
      console.log(`Socket not ready, storing pending join for user: ${userId}`);
      this.pendingJoin = userId;
    }
  }

  // Force join for debugging
  forceJoin(userId) {
    console.log(`Force joining user: ${userId}`);
    if (this.socket) {
      this.socket.emit('join', userId);
    } else {
      console.error('No socket available for force join');
    }
  }

  // Messaging events
  sendMessage(receiverId, message) {
    if (this.socket && this.socket.connected) {
      this.socket.emit('send_message', { receiverId, message });
    }
  }

  onNewMessage(callback) {
    if (this.socket) {
      this.socket.on('new_message', callback);
    }
  }

  sendTyping(receiverId, isTyping) {
    if (this.socket && this.socket.connected) {
      this.socket.emit('typing', { receiverId, isTyping });
    }
  }

  onUserTyping(callback) {
    if (this.socket) {
      this.socket.on('user_typing', callback);
    }
  }

  // Call events - 1:1 calls
  initiateCall(receiverId, callType = 'video') {
    if (this.socket && this.socket.connected) {
      console.log('Initiating call to:', receiverId, 'type:', callType);
      this.socket.emit('initiate_call', { receiverId, callType });
    } else {
      console.warn('Cannot initiate call: socket not connected');
      console.log('Socket status:', this.socket ? this.socket.connected : 'null');
    }
  }

  onIncomingCall(callback) {
    if (this.socket) {
      this.socket.on('incoming_call', callback);
    }
  }

  acceptCall(callerId, callType = 'video') {
    if (this.socket && this.socket.connected) {
      this.socket.emit('accept_call', { callerId, callType });
    } else {
      console.warn('Cannot accept call: socket not connected');
    }
  }

  declineCall(callerId, callType = 'video') {
    if (this.socket && this.socket.connected) {
      this.socket.emit('decline_call', { callerId, callType });
    } else {
      console.warn('Cannot decline call: socket not connected');
    }
  }

  endCall(receiverId, callType = 'video') {
    if (this.socket && this.socket.connected) {
      this.socket.emit('end_call', { receiverId, callType });
    } else {
      console.warn('Cannot end call: socket not connected');
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

  onCallParticipantOffline(callback) {
    if (this.socket) {
      this.socket.on('call_participant_offline', callback);
    }
  }

  // WebRTC signaling events - 1:1 calls
  sendWebRTCOffer(receiverId, offer, callType = 'video') {
    if (this.socket && this.socket.connected) {
      this.socket.emit('webrtc_offer', { receiverId, offer, callType });
    } else {
      console.warn('Cannot send WebRTC offer: socket not connected');
    }
  }

  sendWebRTCAnswer(callerId, answer, callType = 'video') {
    if (this.socket && this.socket.connected) {
      this.socket.emit('webrtc_answer', { callerId, answer, callType });
    } else {
      console.warn('Cannot send WebRTC answer: socket not connected');
    }
  }

  sendIceCandidate(receiverId, candidate, callType = 'video') {
    if (this.socket && this.socket.connected) {
      this.socket.emit('ice_candidate', { receiverId, candidate, callType });
    } else {
      console.warn('Cannot send ICE candidate: socket not connected');
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
    return this.socket && this.socket.connected;
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
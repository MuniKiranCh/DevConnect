import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '../components/UI/Card';
import  Button  from '../components/UI/Button';
import  Input  from '../components/UI/Input';
import Avatar from '../components/UI/Avatar';
import { 
  Phone, 
  Video, 
  PhoneOff, 
  VideoOff, 
  Mic, 
  MicOff, 
  Search, 
  Clock, 
  Users,
  Calendar
} from 'lucide-react';
import { useAuthStore } from '../utils/store';
import { useConnectionsStore } from '../utils/store';
import socketService from '../utils/socket';
import { callAPI } from '../utils/api';
import { toast } from 'react-hot-toast';
import { testMediaDevices, testWebRTCConnection, handleMediaStreamError } from '../utils/videoTest';

const STUN_SERVER = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
    { urls: 'stun:stun.ekiga.net' },
    { urls: 'stun:stun.ideasip.com' },
    { urls: 'stun:stun.rixtelecom.se' },
    { urls: 'stun:stun.schlund.de' }
  ],
  iceCandidatePoolSize: 10,
  bundlePolicy: 'max-bundle',
  rtcpMuxPolicy: 'require'
};

const Calls = () => {
  const { user } = useAuthStore();
  const { connections } = useConnectionsStore();
  const [callHistory, setCallHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('history');
  const [socketConnected, setSocketConnected] = useState(false);

  // Call states
  const [incomingCall, setIncomingCall] = useState(null);
  const [isRinging, setIsRinging] = useState(false);
  const [inCall, setInCall] = useState(false);
  const [callType, setCallType] = useState('video');
  const [callStatus, setCallStatus] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true); // Default to true for voice calls

  // Refs
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const ringtoneRef = useRef(null);
  const callTimerRef = useRef(null);
  const [callStartTime, setCallStartTime] = useState(null);
  const [callDuration, setCallDuration] = useState(0);
  const [activeCallUserId, setActiveCallUserId] = useState(null);
  const [activeCallId, setActiveCallId] = useState(null);

  // Get accepted connections
  const acceptedConnections = connections.filter(conn => conn.status === 'accepted');

  // Ringtone functions
  const playRingtone = () => {
    if (ringtoneRef.current) {
      ringtoneRef.current.play().catch(e => console.log('Ringtone play failed:', e));
    }
  };

  const stopRingtone = () => {
    if (ringtoneRef.current) {
      ringtoneRef.current.pause();
      ringtoneRef.current.currentTime = 0;
    }
  };

  // Socket connection management
  useEffect(() => {
    const socket = socketService.getSocket();
    
    const handleConnect = () => {
      console.log('Socket connected');
      setSocketConnected(true);
      if (user?._id) {
        socket.emit('join', user._id);
      }
    };

    const handleDisconnect = () => {
      console.log('Socket disconnected');
      setSocketConnected(false);
    };

    if (socket) {
      socket.on('connect', handleConnect);
      socket.on('disconnect', handleDisconnect);
      setSocketConnected(socket.connected);
      
      if (socket.connected && user?._id) {
        socket.emit('join', user._id);
      }
    }

    return () => {
      if (socket) {
        socket.off('connect', handleConnect);
        socket.off('disconnect', handleDisconnect);
      }
    };
  }, [user?._id]);

  // Incoming call handlers
  useEffect(() => {
    const socket = socketService.getSocket();
    if (!socket) return;

    // Incoming call handler
    socket.on('incoming_call', (data) => {
      console.log('=== INCOMING CALL ===', data);
      const { callerId, callType, callId } = data;
      
      // Find caller details from connections
      const caller = acceptedConnections.find(conn => conn._id === callerId);
      
      setIncomingCall({
        callerId,
        callType,
        callId,
        callerName: caller ? `${caller.firstName} ${caller.lastName}` : 'Unknown',
        callerPhoto: caller?.photoUrl
      });
      setIsRinging(true);
      playRingtone();
    });

    // Call accepted handler
    socket.on('call_accepted', (data) => {
      console.log('Call accepted:', data);
      setCallStatus('connected');
      toast.success('Call connected!');
      startCallTimer();
    });

    // Call declined handler
    socket.on('call_declined', (data) => {
      console.log('Call declined:', data);
      setIsRinging(false);
      setIncomingCall(null);
      setInCall(false);
      setCallStatus('declined');
      toast.error('Call was declined');
      endCallCleanup();
    });

    // Call ended handler
    socket.on('call_ended', (data) => {
      console.log('Call ended:', data);
      setIsRinging(false);
      setIncomingCall(null);
      setInCall(false);
      setCallStatus('ended');
      toast.info('Call ended');
      endCallCleanup();
    });

    // Participant offline handler
    socket.on('call_participant_offline', (data) => {
      console.log('Call participant offline:', data);
      setIsRinging(false);
      setIncomingCall(null);
      setInCall(false);
      setCallStatus('ended');
      toast.error('User is not online');
      endCallCleanup();
    });

    return () => {
      socket.off('incoming_call');
      socket.off('call_accepted');
      socket.off('call_declined');
      socket.off('call_ended');
      socket.off('call_participant_offline');
    };
  }, [acceptedConnections]);

  // WebRTC signaling handlers with improved error handling
  useEffect(() => {
    const socket = socketService.getSocket();
    if (!socket) return;

    // Handle WebRTC offer
    socket.on('webrtc_offer', async (data) => {
      const { callerId, offer, callType } = data;
      console.log('=== RECEIVED WEBRTC OFFER ===');
      console.log('Caller ID:', callerId);
      console.log('Call type:', callType);
      console.log('Offer:', offer);

      try {
        // Get local media stream with better constraints
        const mediaConstraints = {
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
            sampleRate: 48000
          },
          video: callType === 'video' ? {
            width: { ideal: 1280, max: 1920 },
            height: { ideal: 720, max: 1080 },
            frameRate: { ideal: 30, max: 60 }
          } : false
        };

        const localStream = await navigator.mediaDevices.getUserMedia(mediaConstraints).catch(error => {
          const userMessage = handleMediaStreamError(error, 'during WebRTC offer handling');
          throw new Error(userMessage);
        });
        localStreamRef.current = localStream;
        
        // Set local video
        if (localVideoRef.current && callType === 'video') {
          localVideoRef.current.srcObject = localStream;
          localVideoRef.current.play().catch(e => console.log('Local video play failed:', e));
        }

        // Create peer connection with better configuration
        const peerConnection = new RTCPeerConnection({
          ...STUN_SERVER,
          iceCandidatePoolSize: 10
        });
        peerConnectionRef.current = peerConnection;

        // Add local stream tracks
        localStream.getTracks().forEach(track => {
          console.log('Adding track to peer connection:', track.kind);
          peerConnection.addTrack(track, localStream);
        });

        // Handle remote stream with better error handling
        peerConnection.ontrack = (event) => {
          console.log('Received remote stream:', event.streams[0]);
          remoteStreamRef.current = event.streams[0];
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = event.streams[0];
            remoteVideoRef.current.play().catch(e => console.log('Remote video play failed:', e));
          }
        };

        // Handle ICE candidates
        peerConnection.onicecandidate = (event) => {
          if (event.candidate) {
            console.log('Sending ICE candidate');
            socketService.sendIceCandidate(callerId, event.candidate, callType);
          }
        };

        // Handle connection state changes
        peerConnection.onconnectionstatechange = () => {
          console.log('Connection state changed:', peerConnection.connectionState);
          if (peerConnection.connectionState === 'connected') {
            setCallStatus('connected');
            toast.success('Call connected!');
            startCallTimer();
          } else if (peerConnection.connectionState === 'failed') {
            toast.error('Call connection failed');
            endCallCleanup();
          } else if (peerConnection.connectionState === 'disconnected') {
            toast.error('Call disconnected');
            endCallCleanup();
          }
        };

        // Handle ICE connection state changes
        peerConnection.oniceconnectionstatechange = () => {
          console.log('ICE connection state:', peerConnection.iceConnectionState);
        };

        // Set remote description and create answer
        await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);

        // Send answer back
        socketService.sendWebRTCAnswer(callerId, answer, callType);

      } catch (error) {
        console.error('Error handling WebRTC offer:', error);
        toast.error('Failed to establish connection: ' + error.message);
        endCallCleanup();
      }
    });

    // Handle WebRTC answer
    socket.on('webrtc_answer', async (data) => {
      const { receiverId, answer, callType } = data;
      console.log('Received WebRTC answer:', data);

      if (peerConnectionRef.current) {
        try {
          await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(answer));
        } catch (error) {
          console.error('Error setting remote description:', error);
        }
      }
    });

    // Handle ICE candidates
    socket.on('ice_candidate', async (data) => {
      const { senderId, candidate, callType } = data;
      console.log('Received ICE candidate:', data);

      if (peerConnectionRef.current && candidate) {
        try {
          await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (error) {
          console.error('Error adding ICE candidate:', error);
        }
      }
    });

    return () => {
      socket.off('webrtc_offer');
      socket.off('webrtc_answer');
      socket.off('ice_candidate');
    };
  }, []);

  // Fetch call history
  useEffect(() => {
    fetchCallHistory();
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      console.log('Calls component unmounting, cleaning up...');
      stopRingtone();
      endCallCleanup();
    };
  }, []);

  // Listen for real-time call history updates
  useEffect(() => {
    const socket = socketService.getSocket();
    if (!socket) return;
    const handleCallUpdated = (data) => {
      console.log('Received call_updated event:', data);
      fetchCallHistory();
    };
    socket.on('call_updated', handleCallUpdated);
    return () => {
      socket.off('call_updated', handleCallUpdated);
    };
  }, []);

  // Debug function to test socket connection
  const testSocketConnection = () => {
    const socket = socketService.getSocket();
    console.log('=== SOCKET DEBUG INFO ===');
    console.log('Socket exists:', !!socket);
    console.log('Socket connected:', socket?.connected);
    console.log('Socket ID:', socket?.id);
    console.log('Socket connected state:', socketConnected);
    console.log('User ID:', user?._id);
    
    if (socket && socket.connected) {
      toast.success('Socket is connected!');
    } else {
      toast.error('Socket is not connected');
    }
  };

  // Debug function to test call initiation
  const testCallInitiation = (receiverId) => {
    console.log('=== TESTING CALL INITIATION ===');
    console.log('Receiver ID:', receiverId);
    console.log('User ID:', user?._id);
    
    const socket = socketService.getSocket();
    if (socket && socket.connected) {
      console.log('Emitting initiate_call event...');
      socket.emit('initiate_call', { receiverId, callType: 'video' });
      toast.success('Call initiation test sent');
    } else {
      toast.error('Socket not connected for test');
    }
  };

  // Debug function to test media devices
  const testMediaDevicesDebug = async () => {
    console.log('=== TESTING MEDIA DEVICES ===');
    const results = await testMediaDevices();
    console.log('Media devices test results:', results);
    
    if (results.audio && results.video) {
      toast.success('Media devices working correctly');
    } else {
      toast.error('Media devices test failed - check console for details');
    }
  };

  // Debug function to test WebRTC
  const testWebRTCDebug = async () => {
    console.log('=== TESTING WEBRTC ===');
    const results = await testWebRTCConnection();
    console.log('WebRTC test results:', results);
    
    if (results.rtcPeerConnection && results.iceServers) {
      toast.success('WebRTC working correctly');
    } else {
      toast.error('WebRTC test failed - check console for details');
    }
  };

  const fetchCallHistory = async () => {
    try {
      const response = await callAPI.getCallHistory();
      const calls = response.data.calls || [];
      setCallHistory(calls);
    } catch (error) {
      console.error('Failed to load call history:', error);
      
      // Fallback to mock call history
      const mockCalls = acceptedConnections.slice(0, 2).map((connection, index) => ({
        _id: `mock-${index + 1}`,
        callType: index === 0 ? 'video' : 'audio',
        status: index === 0 ? 'completed' : 'missed',
        duration: index === 0 ? 1800 : 0,
        createdAt: new Date(Date.now() - (index + 1) * 2 * 60 * 60 * 1000),
        participants: [
          {
            _id: connection._id,
            firstName: connection.firstName,
            lastName: connection.lastName,
            photoUrl: connection.photoUrl
          },
          {
            _id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            photoUrl: user.photoUrl
          }
        ],
        initiator: index === 0 ? connection._id : user._id
      }));
      
      setCallHistory(mockCalls);
    } finally {
      setLoading(false);
    }
  };

  // Start call timer
  const startCallTimer = () => {
    const start = Date.now();
    setCallStartTime(start);
    setCallDuration(0);
    if (callTimerRef.current) clearInterval(callTimerRef.current);
    callTimerRef.current = setInterval(() => {
      setCallDuration(Math.floor((Date.now() - start) / 1000));
    }, 1000);
  };

  // Initiate call
  const initiateCall = async (receiverId, type = 'video') => {
    setActiveCallUserId(receiverId);
    console.log('=== INITIATING CALL ===');
    console.log('Receiver ID:', receiverId);
    console.log('Call type:', type);
    
    // Check both the state and actual socket connection
    const socket = socketService.getSocket();
    if (!socketConnected || !socket || !socket.connected) {
      toast.error('You are not connected. Please check your internet connection.');
      return;
    }
    
    setCallType(type);
    setCallStatus('calling');
    setInCall(true);
    
    try {
      // 1. Create call in backend and get callId
      const response = await callAPI.initiateCall(receiverId, type);
      const call = response.data.data;
      const callId = call.callId;
      setActiveCallId(callId);
      
      // 2. Get local media stream with better constraints
      const mediaConstraints = {
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 48000
        },
        video: type === 'video' ? {
          width: { ideal: 1280, max: 1920 },
          height: { ideal: 720, max: 1080 },
          frameRate: { ideal: 30, max: 60 }
        } : false
      };

      const localStream = await navigator.mediaDevices.getUserMedia(mediaConstraints).catch(error => {
        const userMessage = handleMediaStreamError(error, 'during call initiation');
        throw new Error(userMessage);
      });
      localStreamRef.current = localStream;
      
      // Set local video
      if (localVideoRef.current && type === 'video') {
        localVideoRef.current.srcObject = localStream;
        localVideoRef.current.play().catch(e => console.log('Local video play failed:', e));
      }
      
      // 3. Create peer connection with better configuration
      const peerConnection = new RTCPeerConnection({
        ...STUN_SERVER,
        iceCandidatePoolSize: 10
      });
      peerConnectionRef.current = peerConnection;
      
      // Add local stream tracks
      localStream.getTracks().forEach(track => {
        console.log('Adding track to peer connection:', track.kind);
        peerConnection.addTrack(track, localStream);
      });
      
      // Handle remote stream
      peerConnection.ontrack = (event) => {
        console.log('Received remote stream:', event.streams[0]);
        remoteStreamRef.current = event.streams[0];
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = event.streams[0];
          remoteVideoRef.current.play().catch(e => console.log('Remote video play failed:', e));
        }
      };
      
      // Handle ICE candidates
      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          console.log('Sending ICE candidate');
          socketService.sendIceCandidate(receiverId, event.candidate, type);
        }
      };
      
      // Handle connection state changes
      peerConnection.onconnectionstatechange = () => {
        console.log('Connection state changed:', peerConnection.connectionState);
        if (peerConnection.connectionState === 'connected') {
          setCallStatus('connected');
          toast.success('Call connected!');
          startCallTimer();
        } else if (peerConnection.connectionState === 'failed') {
          toast.error('Call connection failed');
          endCallCleanup();
        } else if (peerConnection.connectionState === 'disconnected') {
          toast.error('Call disconnected');
          endCallCleanup();
        }
      };
      
      // Handle ICE connection state changes
      peerConnection.oniceconnectionstatechange = () => {
        console.log('ICE connection state:', peerConnection.iceConnectionState);
      };
      
      // 4. Notify receiver via socket (now with callId)
      socket.emit('initiate_call', { receiverId, callType: type, callId });
      
      // 5. Wait a bit for the call initiation to be processed
      setTimeout(async () => {
        try {
          const offer = await peerConnection.createOffer();
          await peerConnection.setLocalDescription(offer);
          if (socket && socket.connected) {
            socketService.sendWebRTCOffer(receiverId, offer, type);
          } else {
            toast.error('Connection lost while starting call');
            endCallCleanup();
            return;
          }
        } catch (error) {
          console.error('Failed to create call offer:', error);
          toast.error('Failed to create call offer');
          endCallCleanup();
        }
      }, 1000);
    } catch (error) {
      console.error('Failed to start call:', error);
      toast.error('Failed to start call: ' + error.message);
      endCallCleanup();
    }
  };

  // Accept incoming call
  const acceptIncomingCall = async () => {
    if (!incomingCall) return;
    
    setActiveCallUserId(incomingCall.callerId);
    setActiveCallId(incomingCall.callId);
    setIsRinging(false);
    stopRingtone();
    
    try {
      await callAPI.acceptCall(incomingCall.callId);
      
      // Get local media stream with better constraints
      const mediaConstraints = {
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 48000
        },
        video: incomingCall.callType === 'video' ? {
          width: { ideal: 1280, max: 1920 },
          height: { ideal: 720, max: 1080 },
          frameRate: { ideal: 30, max: 60 }
        } : false
      };

      const localStream = await navigator.mediaDevices.getUserMedia(mediaConstraints).catch(error => {
        const userMessage = handleMediaStreamError(error, 'during call acceptance');
        throw new Error(userMessage);
      });
      localStreamRef.current = localStream;
      
      // Set local video
      if (localVideoRef.current && incomingCall.callType === 'video') {
        localVideoRef.current.srcObject = localStream;
        localVideoRef.current.play().catch(e => console.log('Local video play failed:', e));
      }
      
      // Create peer connection with better configuration
      const peerConnection = new RTCPeerConnection({
        ...STUN_SERVER,
        iceCandidatePoolSize: 10
      });
      peerConnectionRef.current = peerConnection;
      
      // Add local stream tracks
      localStream.getTracks().forEach(track => {
        console.log('Adding track to peer connection:', track.kind);
        peerConnection.addTrack(track, localStream);
      });
      
      // Handle remote stream
      peerConnection.ontrack = (event) => {
        console.log('Received remote stream:', event.streams[0]);
        remoteStreamRef.current = event.streams[0];
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = event.streams[0];
          remoteVideoRef.current.play().catch(e => console.log('Remote video play failed:', e));
        }
      };
      
      // Handle ICE candidates
      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          console.log('Sending ICE candidate');
          socketService.sendIceCandidate(incomingCall.callerId, event.candidate, incomingCall.callType);
        }
      };
      
      // Handle connection state changes
      peerConnection.onconnectionstatechange = () => {
        console.log('Connection state changed:', peerConnection.connectionState);
        if (peerConnection.connectionState === 'connected') {
          setCallStatus('connected');
          toast.success('Call connected!');
          startCallTimer();
        } else if (peerConnection.connectionState === 'failed') {
          toast.error('Call connection failed');
          endCallCleanup();
        } else if (peerConnection.connectionState === 'disconnected') {
          toast.error('Call disconnected');
          endCallCleanup();
        }
      };
      
      // Handle ICE connection state changes
      peerConnection.oniceconnectionstatechange = () => {
        console.log('ICE connection state:', peerConnection.iceConnectionState);
      };
      
      socketService.acceptCall(incomingCall.callerId, incomingCall.callType, incomingCall.callId);
      setIncomingCall(null);
      setInCall(true);
      setCallType(incomingCall.callType);
      setCallStatus('in-call');
      toast.success('Call accepted!');
    } catch (error) {
      console.error('Failed to accept call:', error);
      toast.error('Failed to accept call: ' + (error?.response?.data?.message || error.message));
      setIncomingCall(null);
      setIsRinging(false);
      setInCall(false);
      setCallStatus('');
      endCallCleanup();
      fetchCallHistory();
    }
  };

  // Decline incoming call
  const declineIncomingCall = async () => {
    if (!incomingCall) return;
    setIsRinging(false);
    if (ringtoneRef.current) {
      ringtoneRef.current.pause();
      ringtoneRef.current.currentTime = 0;
    }
    try {
      // Use callId from incomingCall
      const callId = incomingCall.callId;
      await callAPI.declineCall(callId);
      socketService.declineCall(incomingCall.callerId, incomingCall.callType, callId);
      setIncomingCall(null);
      toast('Call declined');
    } catch (error) {
      toast.error('Failed to decline call: ' + (error?.response?.data?.message || error.message));
      setIncomingCall(null);
      setIsRinging(false);
      setInCall(false);
      setCallStatus('');
      endCallCleanup();
      fetchCallHistory();
    }
  };

  // End call
  const endCall = async () => {
    try {
      if (!activeCallId) throw new Error('No active callId');
      await callAPI.endCall(activeCallId);
      if (incomingCall) {
        socketService.declineCall(incomingCall.callerId, incomingCall.callType, activeCallId);
      } else if (activeCallUserId) {
        socketService.endCall(activeCallUserId, callType, activeCallId);
      }
      setIncomingCall(null);
      setInCall(false);
      setCallStatus('ended');
      setActiveCallUserId(null);
      setActiveCallId(null);
      endCallCleanup();
    } catch (error) {
      toast.error('Failed to end call: ' + (error?.response?.data?.message || error.message));
      endCallCleanup();
    }
  };

  // Cleanup function
  const endCallCleanup = () => {
    console.log('Cleaning up call resources...');
    stopRingtone();
    
    // Clear call timer
    if (callTimerRef.current) {
      clearInterval(callTimerRef.current);
      callTimerRef.current = null;
    }
    
    // Close peer connection
    if (peerConnectionRef.current) {
      console.log('Closing peer connection...');
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    
    // Stop local stream tracks
    if (localStreamRef.current) {
      console.log('Stopping local stream tracks...');
      localStreamRef.current.getTracks().forEach(track => {
        console.log('Stopping track:', track.kind);
        track.stop();
      });
      localStreamRef.current = null;
    }
    
    // Clear remote stream
    remoteStreamRef.current = null;
    
    // Clear video elements
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }
    
    // Reset states
    setCallStatus('');
    setIsMuted(false);
    setIsVideoOff(false);
    setActiveCallUserId(null);
    setActiveCallId(null);
    setCallDuration(0);
    setCallStartTime(null);
    
    console.log('Call cleanup completed');
  };

  // Toggle mute
  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTracks = localStreamRef.current.getAudioTracks();
      audioTracks.forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsMuted(!isMuted);
    }
  };

  // Toggle video
  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTracks = localStreamRef.current.getVideoTracks();
      videoTracks.forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsVideoOff(!isVideoOff);
    }
  };

  // Format duration
  const formatDuration = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Format date
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString();
  };

  // Filter call history
  const filteredCallHistory = callHistory.filter(call => {
    // Show all calls where the user is either the caller or receiver
    return call.caller && call.receiver && (call.caller._id === user._id || call.receiver._id === user._id);
  });

  // Call History Item Component
  const CallHistoryItem = ({ call }) => {
    const otherParticipant = call.caller._id === user._id ? call.receiver : call.caller;
    const isOutgoing = call.caller._id === user._id;

    return (
      <div className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-lg transition-colors">
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-full ${
            call.status === 'completed' ? 'bg-green-100' : 
            call.status === 'missed' ? 'bg-red-100' : 'bg-gray-100'
          }`}>
            {call.callType === 'video' ? (
              <Video className={`h-4 w-4 ${
                call.status === 'completed' ? 'text-green-600' : 
                call.status === 'missed' ? 'text-red-600' : 'text-gray-600'
              }`} />
            ) : (
              <Phone className={`h-4 w-4 ${
                call.status === 'completed' ? 'text-green-600' : 
                call.status === 'missed' ? 'text-red-600' : 'text-gray-600'
              }`} />
            )}
          </div>
          <Avatar
            src={otherParticipant?.photoUrl}
            alt={`${otherParticipant?.firstName} ${otherParticipant?.lastName}`}
            size="md"
          />
          <div>
            <h3 className="font-medium text-gray-900">
              {otherParticipant?.firstName} {otherParticipant?.lastName}
            </h3>
            <p className="text-sm text-gray-500">
              {isOutgoing ? 'Outgoing' : 'Incoming'} • {call.callType} • {formatDate(call.createdAt)}
            </p>
            {call.duration > 0 && (
              <p className="text-xs text-gray-400">{formatDuration(call.duration)}</p>
            )}
          </div>
        </div>
        <div className="flex space-x-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => initiateCall(otherParticipant._id, 'audio')}
          >
            <Phone className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => initiateCall(otherParticipant._id, 'video')}
          >
            <Video className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  };

  // Call Controls Component
  const CallControls = () => (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 flex items-center space-x-4 bg-white p-4 rounded-full shadow-lg border">
      <Button
        size="lg"
        onClick={toggleMute}
        className={isMuted ? 'bg-red-100 text-red-600' : ''}
      >
        {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
      </Button>
      
      {callType === 'video' && (
        <Button
          size="lg"
          onClick={toggleVideo}
          className={isVideoOff ? 'bg-red-100 text-red-600' : ''}
        >
          {isVideoOff ? <VideoOff className="h-5 w-5" /> : <Video className="h-5 w-5" />}
        </Button>
      )}
      
      <Button
        size="lg"
        onClick={endCall}
        className="bg-red-600 hover:bg-red-700"
      >
        <PhoneOff className="h-5 w-5" />
      </Button>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading call history...</div>
      </div>
    );
  }

  // Show message when no accepted connections
  if (acceptedConnections.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No connections yet</h3>
          <p className="text-gray-600 mb-4">
            You need to have accepted connections to make calls. 
            Connect with other developers to start calling.
          </p>
          <Button onClick={() => window.location.href = '/connections'}>
            <Users className="h-4 w-4 mr-2" />
            Go to Connections
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      <div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Calls</h1>
            <p className="text-gray-600">Manage your video and audio calls</p>
          </div>
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${socketConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-sm text-gray-500">
              {socketConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center space-x-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search call history..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline">
          <Calendar className="h-4 w-4 mr-2" />
          Filter
        </Button>
        {!audioEnabled && (
          <Button 
            variant="outline" 
            onClick={() => setAudioEnabled(true)}
            className="bg-purple-100 text-purple-800 hover:bg-purple-200"
          >
            🔊 Enable Audio
          </Button>
        )}
        {audioEnabled && (
          <div className="flex items-center space-x-2 px-3 py-2 bg-green-100 text-green-800 rounded-md">
            <span className="text-sm">🔊 Audio Enabled</span>
          </div>
        )}
        <Button 
          variant="outline" 
          onClick={testSocketConnection}
          className="bg-blue-100 text-blue-800 hover:bg-blue-200"
        >
          Test Socket
        </Button>
        <Button 
          variant="outline" 
          onClick={testMediaDevicesDebug}
          className="bg-green-100 text-green-800 hover:bg-green-200"
        >
          Test Media
        </Button>
        <Button 
          variant="outline" 
          onClick={testWebRTCDebug}
          className="bg-orange-100 text-orange-800 hover:bg-orange-200"
        >
          Test WebRTC
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        <button
          onClick={() => setActiveTab('history')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'history'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Clock className="h-4 w-4 inline mr-2" />
          Call History
        </button>
        <button
          onClick={() => setActiveTab('contacts')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'contacts'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Users className="h-4 w-4 inline mr-2" />
          Quick Call
        </button>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'history' && (
          <div className="space-y-4">
            {filteredCallHistory.length === 0 ? (
              <div className="text-center py-8">
                <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No call history</h3>
                <p className="text-gray-600">Start making calls to see your history here.</p>
              </div>
            ) : (
              filteredCallHistory.map((call) => (
                <CallHistoryItem key={call._id} call={call} />
              ))
            )}
          </div>
        )}

        {activeTab === 'contacts' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {acceptedConnections.map(connection => (
              <Card key={connection._id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="text-center">
                    <div className="relative inline-block mb-4">
                      <Avatar
                        src={connection.photoUrl}
                        alt={`${connection.firstName} ${connection.lastName}`}
                        size="xl"
                        status="online"
                      />
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2">
                      {connection.firstName} {connection.lastName}
                    </h3>
                    <p className="text-sm text-gray-500 mb-4">
                      {connection.title || 'Developer'}
                    </p>
                    <div className="flex justify-center space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => initiateCall(connection._id, 'audio')}
                      >
                        <Phone className="h-4 w-4 mr-1" />
                        Audio
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => initiateCall(connection._id, 'video')}
                      >
                        <Video className="h-4 w-4 mr-1" />
                        Video
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Incoming Call Modal */}
      {isRinging && incomingCall && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-75 z-50">
          <div className="bg-white p-8 rounded-lg shadow-2xl text-center max-w-md w-full mx-4">
            <div className="animate-pulse mb-4">
              <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                {incomingCall.callType === 'video' ? (
                  <Video className="w-8 h-8 text-white" />
                ) : (
                  <Phone className="w-8 h-8 text-white" />
                )}
              </div>
            </div>
            <h2 className="text-2xl font-bold mb-2 text-gray-900">Incoming Call</h2>
            <div className="flex flex-col items-center mb-4">
              <Avatar
                src={incomingCall.callerPhoto}
                alt={incomingCall.callerName}
                size="xl"
                className="mb-2"
              />
              <span className="font-semibold text-lg">
                {incomingCall.callerName} is calling you
              </span>
              <p className="text-sm text-gray-500 mt-1">
                {incomingCall.callType === 'video' ? 'Video Call' : 'Audio Call'}
              </p>
            </div>
            <div className="flex justify-center space-x-4">
              <button 
                onClick={acceptIncomingCall} 
                className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center space-x-2"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span>Accept</span>
              </button>
              <button 
                onClick={declineIncomingCall} 
                className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center space-x-2"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
                <span>Decline</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Active Call Interface */}
      {inCall && (
        <div className="fixed inset-0 bg-black z-40">
          <div className="relative w-full h-full">
            {/* Remote Video (Large) */}
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              muted={false}
              className="w-full h-full object-cover"
              onLoadedMetadata={() => console.log('Remote video loaded')}
              onError={(e) => console.error('Remote video error:', e)}
            />
            
            {/* Audio element for audio-only calls */}
            {callType === 'audio' && (
              <audio
                ref={remoteVideoRef}
                autoPlay
                muted={false}
                style={{ display: 'none' }}
                onLoadedMetadata={() => console.log('Remote audio loaded')}
                onError={(e) => console.error('Remote audio error:', e)}
              />
            )}
            
            {/* Local Video (Small - PiP) */}
            {callType === 'video' && (
              <div className="absolute top-4 right-4 w-48 h-36 bg-black rounded-lg border-2 border-white shadow-lg overflow-hidden">
                <video 
                  ref={localVideoRef} 
                  autoPlay 
                  playsInline 
                  muted 
                  className="w-full h-full object-cover"
                  onLoadedMetadata={() => console.log('Local video loaded')}
                  onError={(e) => console.error('Local video error:', e)}
                />
              </div>
            )}
            
            {/* Call status overlay */}
            <div className="absolute top-4 left-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded-md">
              <span className="text-sm">
                {callStatus === 'connected' ? 'Connected' : 
                 callStatus === 'calling' ? 'Calling...' : 
                 callStatus === 'in-call' ? 'In Call' : callStatus}
              </span>
              {callDuration > 0 && (
                <span className="ml-2 text-sm">{formatDuration(callDuration)}</span>
              )}
            </div>
            
            {/* Call Controls */}
            <CallControls />
          </div>
        </div>
      )}

      {/* Ringtone audio element (hidden) */}
      <audio ref={ringtoneRef} src="/ringtone.mp3" loop style={{ display: 'none' }} />
    </div>
  );
};

export default Calls; 
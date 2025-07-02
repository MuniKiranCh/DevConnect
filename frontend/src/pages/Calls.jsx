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

const STUN_SERVER = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' }
  ]
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
  const [audioEnabled, setAudioEnabled] = useState(false);

  // Refs
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const ringtoneRef = useRef(null);

  // Filter connections to only show accepted ones
  const acceptedConnections = connections.filter(conn => conn.status === 'accepted' || !conn.status);

  // New state
  const [activeCallUserId, setActiveCallUserId] = useState(null);
  const [activeCallId, setActiveCallId] = useState(null);
  const [callStartTime, setCallStartTime] = useState(null);
  const [callDuration, setCallDuration] = useState(0);
  const callTimerRef = useRef(null);

  // Ringtone functions
  const playRingtone = () => {
    const audio = ringtoneRef.current;
    if (audio) {
      audio.currentTime = 0;
      audio.play().catch((err) => {
        console.error('Ringtone play failed:', err);
      });
    }
  };

  const stopRingtone = () => {
    const audio = ringtoneRef.current;
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
  };

  // Monitor socket connection status
  useEffect(() => {
    const socket = socketService.getSocket();
    if (!socket) return;

    const handleConnect = () => {
      setSocketConnected(true);
      console.log('Socket connected in Calls page');
    };
    
    const handleDisconnect = () => {
      setSocketConnected(false);
      console.log('Socket disconnected in Calls page');
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    
    // Set initial status
    setSocketConnected(socket.connected);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
    };
  }, []);

  // Socket event listeners for calls
  useEffect(() => {
    const socket = socketService.getSocket();
    if (!socket) return;

    // Incoming call handler
    socket.on('incoming_call', (data) => {
      console.log('=== INCOMING CALL RECEIVED ===');
      console.log('Call data:', data);
      const { callerId, callType, callId } = data;
      // Find caller info
      const caller = acceptedConnections.find(c => c._id === callerId);
      if (!caller) {
        console.error('Caller not found in connections');
        return;
      }
      setIncomingCall({
        callerId,
        callType,
        callId,
        callerName: `${caller.firstName} ${caller.lastName}`,
        callerPhoto: caller.photoUrl
      });
      setCallType(callType);
      setIsRinging(true);
      playRingtone();
    });

    // Call accepted handler
    socket.on('call_accepted', (data) => {
      console.log('Call accepted:', data);
      setIsRinging(false);
      setIncomingCall(null);
      setInCall(true);
      setCallStatus('in-call');
      
      // Stop ringtone
      stopRingtone();
      
      toast.success('Call connected!');
    });

    // Call declined handler
    socket.on('call_declined', (data) => {
      console.log('Call declined:', data);
      setIsRinging(false);
      setIncomingCall(null);
      setInCall(false);
      setCallStatus('declined');
      stopRingtone();
      toast('Call was declined');
      endCallCleanup();
    });

    // Call ended handler
    socket.on('call_ended', (data) => {
      console.log('Call ended:', data);
      setIsRinging(false);
      setIncomingCall(null);
      setInCall(false);
      setCallStatus('ended');
      stopRingtone();
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

  // WebRTC signaling handlers
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
        // Get local media stream
        const localStream = await navigator.mediaDevices.getUserMedia({ 
          video: callType === 'video', 
          audio: true 
        });
        localStreamRef.current = localStream;
        
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = localStream;
        }

        // Create peer connection
        const peerConnection = new RTCPeerConnection(STUN_SERVER);
        peerConnectionRef.current = peerConnection;

        // Add local stream tracks
        localStream.getTracks().forEach(track => {
          peerConnection.addTrack(track, localStream);
        });

        // Handle remote stream
        peerConnection.ontrack = (event) => {
          console.log('Received remote stream');
          remoteStreamRef.current = event.streams[0];
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = event.streams[0];
          }
        };

        // Handle ICE candidates
        peerConnection.onicecandidate = (event) => {
          if (event.candidate) {
            socketService.sendIceCandidate(callerId, event.candidate, callType);
          }
        };

        // Set remote description and create answer
        await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);

        // Send answer back
        socketService.sendWebRTCAnswer(callerId, answer, callType);

      } catch (error) {
        console.error('Error handling WebRTC offer:', error);
        toast.error('Failed to establish connection');
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

  // Cleanup ringtone on unmount
  useEffect(() => {
    return () => {
      stopRingtone();
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
      // 2. Get local media stream
      const localStream = await navigator.mediaDevices.getUserMedia({ 
        video: type === 'video', 
        audio: true 
      });
      localStreamRef.current = localStream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = localStream;
      }
      // 3. Create peer connection
      const peerConnection = new RTCPeerConnection(STUN_SERVER);
      peerConnectionRef.current = peerConnection;
      localStream.getTracks().forEach(track => {
        peerConnection.addTrack(track, localStream);
      });
      peerConnection.ontrack = (event) => {
        remoteStreamRef.current = event.streams[0];
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = event.streams[0];
        }
      };
      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          socketService.sendIceCandidate(receiverId, event.candidate, type);
        }
      };
      peerConnection.onconnectionstatechange = () => {
        if (peerConnection.connectionState === 'connected') {
          setCallStatus('connected');
          toast.success('Call connected!');
          startCallTimer();
        } else if (peerConnection.connectionState === 'failed') {
          toast.error('Call connection failed');
          endCallCleanup();
        }
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
          toast.error('Failed to create call offer');
          endCallCleanup();
        }
      }, 1000);
    } catch (error) {
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
    if (ringtoneRef.current) {
      ringtoneRef.current.pause();
      ringtoneRef.current.currentTime = 0;
    }
    try {
      await callAPI.acceptCall(incomingCall.callId);
      // Get local media stream
      const localStream = await navigator.mediaDevices.getUserMedia({ 
        video: incomingCall.callType === 'video', 
        audio: true 
      });
      localStreamRef.current = localStream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = localStream;
      }
      const peerConnection = new RTCPeerConnection(STUN_SERVER);
      peerConnectionRef.current = peerConnection;
      localStream.getTracks().forEach(track => {
        peerConnection.addTrack(track, localStream);
      });
      peerConnection.ontrack = (event) => {
        remoteStreamRef.current = event.streams[0];
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = event.streams[0];
        }
      };
      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          socketService.sendIceCandidate(incomingCall.callerId, event.candidate, incomingCall.callType);
        }
      };
      peerConnection.onconnectionstatechange = () => {
        if (peerConnection.connectionState === 'connected') {
          setCallStatus('connected');
          toast.success('Call connected!');
          startCallTimer();
        } else if (peerConnection.connectionState === 'failed') {
          toast.error('Call connection failed');
          endCallCleanup();
        }
      };
      socketService.acceptCall(incomingCall.callerId, incomingCall.callType, incomingCall.callId);
      setIncomingCall(null);
      setInCall(true);
      setCallType(incomingCall.callType);
      setCallStatus('in-call');
      toast.success('Call accepted!');
    } catch (error) {
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
    stopRingtone();
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }
    remoteStreamRef.current = null;
    setCallStatus('');
    setIsMuted(false);
    setIsVideoOff(false);
    setActiveCallUserId(null);
    setActiveCallId(null);
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
              className="w-full h-full object-cover"
            />
            {/* Audio element for audio-only calls */}
            {callType === 'audio' && (
              <audio
                ref={remoteVideoRef}
                autoPlay
                style={{ display: 'none' }}
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
                />
              </div>
            )}
            
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
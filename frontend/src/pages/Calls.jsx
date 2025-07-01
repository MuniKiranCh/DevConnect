import React, { useState, useEffect, useRef } from 'react';
import { 
  Phone, 
  Video, 
  PhoneOff, 
  Mic, 
  MicOff, 
  VideoOff, 
  MoreVertical,
  Search,
  Calendar,
  Clock,
  User,
  Users
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Button, Input, Avatar } from '../components/UI';
import { useCallsStore, useAuthStore, useConnectionsStore } from '../utils/store';
import { callAPI } from '../utils/api';
import toast from 'react-hot-toast';
import io from 'socket.io-client';

const socket = io('http://192.168.155.234:3000'); // Adjust if backend URL changes
const RINGTONE_URL = 'https://actions.google.com/sounds/v1/alarms/alarm_clock.ogg';

// STUN server configuration like the working example
const STUN_SERVER = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

const Calls = () => {
  const user = useAuthStore((state) => state.user);
  const { connections } = useConnectionsStore();
  const { callHistory, setCallHistory } = useCallsStore();
  
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('history');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentCall, setCurrentCall] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [selectedParticipants, setSelectedParticipants] = useState([]);
  const [incomingCall, setIncomingCall] = useState(null);
  const [isRinging, setIsRinging] = useState(false);
  const [inCall, setInCall] = useState(false);
  const [callType, setCallType] = useState('video');
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [callStatus, setCallStatus] = useState('');
  const [socketConnected, setSocketConnected] = useState(false);
  const [processingPendingCall, setProcessingPendingCall] = useState(false);

  // WebRTC refs and state - following the working example pattern
  const localStreamRef = useRef(null);
  const localVideoRef = useRef(null);
  const ringtoneRef = useRef(null);
  const connectionsRef = useRef({}); // Store peer connections like the example
  const [remoteStreams, setRemoteStreams] = useState({});

  useEffect(() => {
    fetchCallHistory();
  }, []);

  // Handle pending calls from other pages
  useEffect(() => {
    const pendingCall = sessionStorage.getItem('pendingCall');
    if (pendingCall && !processingPendingCall) {
      try {
        const callData = JSON.parse(pendingCall);
        console.log('Found pending call from other page:', callData);
        
        // Set processing flag to prevent duplicate handling
        setProcessingPendingCall(true);
        
        // Clear the pending call data immediately
        sessionStorage.removeItem('pendingCall');
        
        // If the call was accepted, start the call process
        if (callData.accepted) {
          console.log('Processing accepted call from other page...');
          setIncomingCall(callData);
          setCallType(callData.callType);
          
          // Wait a bit for the component to fully mount before starting call
          setTimeout(() => {
            console.log('Starting call process for accepted call...');
            acceptIncomingCall();
            setProcessingPendingCall(false);
          }, 500);
        } else {
          setProcessingPendingCall(false);
        }
      } catch (error) {
        console.error('Error parsing pending call data:', error);
        sessionStorage.removeItem('pendingCall');
        setProcessingPendingCall(false);
      }
    }
  }, [processingPendingCall]);

  // Join socket room for receiving calls
  useEffect(() => {
    if (user?._id) {
      socket.emit('join', user._id);
      console.log(`Joined socket room as user: ${user._id}`);
    }
    
    // Monitor socket connection status
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
  }, [user?._id]);

  // Handle incoming call signaling
  useEffect(() => {
    socket.on('incoming_call', (data) => {
      // Ignore if the current user is the caller
      if (data.callerId === user?._id) return;
      console.log('Received incoming call in Calls page:', data);
      setIncomingCall(data);
      setIsRinging(true);
      
      // Play ringtone with better error handling
      if (ringtoneRef.current) {
        ringtoneRef.current.muted = false;
        ringtoneRef.current.volume = 0.5;
        ringtoneRef.current.play().catch(error => {
          console.error('Error playing ringtone in Calls page:', error);
          // Try again with user interaction
          const playPromise = ringtoneRef.current.play();
          if (playPromise !== undefined) {
            playPromise.catch(e => console.error('Ringtone play failed:', e));
          }
        });
      }
    });

    socket.on('call_ended', () => {
      console.log('Call ended in Calls page');
      setIncomingCall(null);
      setIsRinging(false);
      endCallCleanup();
      
      // Stop ringtone
      if (ringtoneRef.current) {
        ringtoneRef.current.pause();
        ringtoneRef.current.currentTime = 0;
      }
    });

    // Handle offline participants notification
    socket.on('call_participants_offline', (data) => {
      console.log('Some participants are offline:', data);
      const offlineNames = data.offlineParticipants.map(pid => 
        connections.find(c => c._id === pid)?.firstName || pid
      ).join(', ');
      toast.error(`Cannot reach: ${offlineNames}. They may be offline.`);
    });

    return () => {
      socket.off('incoming_call');
      socket.off('call_ended');
      socket.off('call_participants_offline');
    };
  }, [connections]);

  // WebRTC signaling handlers - following the working example pattern
  useEffect(() => {
    socket.on('webrtc_offer', async (data) => {
      const { callerId, offer, participantIds } = data;
      if (callerId === user._id) return;
      console.log(`[WebRTC] Received offer from ${callerId} (user: ${user._id})`, data);

      let localStream = localStreamRef.current;
      if (!localStream) {
        localStream = await navigator.mediaDevices.getUserMedia({ video: callType === 'video', audio: true });
        localStreamRef.current = localStream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = localStream;
        }
      }

      let peerConnection = connectionsRef.current[callerId];
      if (!peerConnection) {
        peerConnection = new RTCPeerConnection(STUN_SERVER);
        connectionsRef.current[callerId] = peerConnection;
        console.log(`[WebRTC] Created peer connection for ${callerId}`);

        localStream.getTracks().forEach((track) => {
          peerConnection.addTrack(track, localStream);
        });

        peerConnection.onicecandidate = (event) => {
          if (event.candidate) {
            console.log(`[WebRTC] Sending ICE candidate to ${callerId}`, event.candidate);
            socket.emit('ice_candidate', {
              participantIds,
              candidate: event.candidate,
              callId: null,
            });
          }
        };

        peerConnection.ontrack = (event) => {
          console.log(`[WebRTC] Receiving remote stream from ${callerId}`, event.streams[0]);
          setRemoteStreams(prev => ({
            ...prev,
            [callerId]: event.streams[0]
          }));
        };
      }

      await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);
      console.log(`[WebRTC] Sending answer to ${callerId}`);
      socket.emit('webrtc_answer', {
        participantIds,
        answer,
        callId: null,
      });
    });

    socket.on('webrtc_answer', async (data) => {
      const { receiverId, answer } = data;
      const peerConnection = connectionsRef.current[receiverId];
      if (peerConnection) {
        console.log(`[WebRTC] Received answer from ${receiverId}`);
        await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
      }
    });

    socket.on('ice_candidate', async (data) => {
      const { senderId, candidate } = data;
      const peerConnection = connectionsRef.current[senderId];
      if (peerConnection && candidate) {
        console.log(`[WebRTC] Adding ICE candidate from ${senderId}`, candidate);
        await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
      }
    });

    return () => {
      socket.off('webrtc_offer');
      socket.off('webrtc_answer');
      socket.off('ice_candidate');
    };
  }, [user._id, callType]);

  const fetchCallHistory = async () => {
    try {
      const response = await callAPI.getCallHistory();
      const calls = response.data.calls || [];
      setCallHistory(calls);
    } catch (error) {
      console.error('Failed to load call history:', error);
      
      // Fallback to mock call history - only include accepted connections
      const mockCalls = acceptedConnections.slice(0, 2).map((connection, index) => ({
        _id: `mock-${index + 1}`,
        callType: index === 0 ? 'video' : 'audio',
        status: index === 0 ? 'completed' : 'missed',
        duration: index === 0 ? 1800 : 0, // 30 minutes for completed call
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
      toast.error('Failed to load call history, showing mock data');
    } finally {
      setLoading(false);
    }
  };

  const initiateCall = async (userId, callType = 'video') => {
    try {
      const response = await callAPI.initiateCall(userId, { callType });
      setCurrentCall(response.data.call);
      toast.success(`${callType === 'video' ? 'Video' : 'Audio'} call initiated`);
    } catch (error) {
      toast.error('Failed to initiate call');
    }
  };

  const endCall = async () => {
    if (!currentCall) return;
    
    try {
      await callAPI.endCall(currentCall._id);
      setCurrentCall(null);
      setIsMuted(false);
      setIsVideoOff(false);
      toast.success('Call ended');
    } catch (error) {
      toast.error('Failed to end call');
    }
  };

  const formatDuration = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString();
  };

  // Filter call history to only include accepted connections
  const acceptedConnections = connections.filter(conn => conn.status === 'accepted' || !conn.status);
  const filteredCallHistory = callHistory.filter(call => {
    const otherParticipant = Array.isArray(call.participants)
      ? call.participants.find(p => p._id !== user._id)
      : null;
    const isAcceptedConnection = acceptedConnections.some(conn => conn._id === otherParticipant?._id);
    const matchesSearch = `${otherParticipant?.firstName} ${otherParticipant?.lastName}`.toLowerCase().includes(searchQuery.toLowerCase());
    return isAcceptedConnection && matchesSearch;
  });

  const CallHistoryItem = ({ call }) => {
    const otherParticipant = Array.isArray(call.participants)
      ? call.participants.find(p => p._id !== user._id)
      : null;
    const isOutgoing = call.initiator === user._id;

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
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <span>{isOutgoing ? 'Outgoing' : 'Incoming'}</span>
              <span>•</span>
              <span>{call.callType}</span>
              {call.duration && (
                <>
                  <span>•</span>
                  <span>{formatDuration(call.duration)}</span>
                </>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-right">
            <p className="text-sm text-gray-500">{formatDate(call.createdAt)}</p>
            <p className="text-xs text-gray-400">{new Date(call.createdAt).toLocaleTimeString()}</p>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => quickCall(otherParticipant?._id, call.callType)}
            >
              {call.callType === 'video' ? <Video className="h-4 w-4" /> : <Phone className="h-4 w-4" />}
            </Button>
            <button className="p-2 hover:bg-gray-100 rounded-full">
              <MoreVertical className="h-4 w-4 text-gray-500" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  const CallControls = () => (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4">
      <div className="flex items-center justify-center space-x-4">
        <Button
          variant="outline"
          size="lg"
          onClick={() => setIsMuted(!isMuted)}
          className={isMuted ? 'bg-red-100 text-red-600' : ''}
        >
          {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
        </Button>
        
        <Button
          variant="outline"
          size="lg"
          onClick={() => setIsVideoOff(!isVideoOff)}
          className={isVideoOff ? 'bg-red-100 text-red-600' : ''}
        >
          {isVideoOff ? <VideoOff className="h-5 w-5" /> : <Video className="h-5 w-5" />}
        </Button>
        
        <Button
          size="lg"
          onClick={endCallForAll}
          className="bg-red-600 hover:bg-red-700"
        >
          <PhoneOff className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );

  // Quick Call (1:1) handler
  const quickCall = async (userId, type = 'video') => {
    setCallType(type);
    setCallStatus('calling');
    setSelectedParticipants([userId]);
    await startGroupCall([userId], type);
  };

  // Helper to create and send offer to a peer
  async function createAndSendOffer(pid, localStream, participantIds, callId = null) {
    const peerConnection = new RTCPeerConnection(STUN_SERVER);
    connectionsRef.current[pid] = peerConnection;

    // Add local tracks
    localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));

    // ICE
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('ice_candidate', {
          participantIds,
          candidate: event.candidate,
          callId,
        });
      }
    };

    // Remote stream
    peerConnection.ontrack = (event) => {
      setRemoteStreams(prev => ({
        ...prev,
        [pid]: event.streams[0]
      }));
    };

    // Create and send offer
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    socket.emit('webrtc_offer', {
      participantIds,
      offer,
      callId,
    });
  }

  // Start group call - refactored to match working example
  const startGroupCall = async (participantIds = selectedParticipants, type = 'video') => {
    if (participantIds.length === 0) return;
    setCallType(type);
    setCallStatus('calling');
    setInCall(true);
    try {
      const localStream = await navigator.mediaDevices.getUserMedia({ video: type === 'video', audio: true });
      localStreamRef.current = localStream;
      if (localVideoRef.current) localVideoRef.current.srcObject = localStream;
      socket.emit('initiate_call', { participantIds: [user._id, ...participantIds], callType: type });
      // Symmetrical: create peer connections and send offers to all others
      participantIds.forEach(pid => {
        if (pid !== user._id) createAndSendOffer(pid, localStream, [user._id, ...participantIds]);
      });
    } catch (error) {
      toast.error('Failed to start call: ' + error.message);
      endCallCleanup();
    }
  };

  // End call handler
  const endCallForAll = () => {
    setInCall(false);
    setCallStatus('ended');
    endCallCleanup();
    
    socket.emit('end_call', {
      participantIds: Object.keys(connectionsRef.current),
      callId: null,
    });
  };

  // Cleanup function
  const endCallCleanup = () => {
    // Close all peer connections
    Object.values(connectionsRef.current).forEach(pc => {
      pc.close();
    });
    connectionsRef.current = {};
    
    // Stop local stream
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }
    
    // Clear remote streams
    setRemoteStreams({});
    
    // Reset UI state
    setInCall(false);
    setCallStatus('');
    setIsMuted(false);
    setIsVideoOff(false);
    setIsCameraOff(false);
  };

  // Mute/Unmute
  const toggleMute = () => {
    setIsMuted((prev) => {
      if (localStreamRef.current) {
        localStreamRef.current.getAudioTracks().forEach(track => track.enabled = prev);
      }
      return !prev;
    });
  };

  // Camera On/Off
  const toggleCamera = () => {
    setIsCameraOff((prev) => {
      if (localStreamRef.current) {
        localStreamRef.current.getVideoTracks().forEach(track => track.enabled = prev);
      }
      return !prev;
    });
  };

  // Video layout rendering
  const renderVideoLayout = () => {
    const remoteEntries = Object.entries(remoteStreams);
    console.log('[VIDEO] Rendering video layout with remote streams:', remoteEntries.map(([id, stream]) => ({ id, tracks: stream.getTracks().map(t => t.kind) })));
    
    // 1:1 call: show remote big, local small
    if (remoteEntries.length === 1) {
      const [peerId, stream] = remoteEntries[0];
      const participant = connections.find(c => c._id === peerId);
      console.log('[VIDEO] Rendering 1:1 call layout for peer:', peerId, 'participant:', participant?.firstName);
      return (
        <div className="relative w-full h-96 flex items-center justify-center bg-black rounded-lg">
          <video
            srcObject={stream}
            autoPlay
            playsInline
            className="w-full h-96 object-cover rounded-lg"
            onLoadedMetadata={() => console.log('[VIDEO] Remote video loaded metadata')}
            onCanPlay={() => console.log('[VIDEO] Remote video can play')}
            onError={(e) => console.error('[VIDEO] Remote video error:', e)}
          />
          {/* Local video as small PiP */}
          <div className="absolute bottom-4 right-4 w-32 h-24 bg-black rounded-lg border-2 border-white shadow-lg overflow-hidden">
            <video 
              ref={localVideoRef} 
              autoPlay 
              playsInline 
              muted 
              className="w-full h-full object-cover"
              onLoadedMetadata={() => console.log('[VIDEO] Local video loaded metadata')}
              onCanPlay={() => console.log('[VIDEO] Local video can play')}
              onError={(e) => console.error('[VIDEO] Local video error:', e)}
            />
          </div>
          <span className="absolute top-4 left-4 text-white bg-black bg-opacity-50 px-2 py-1 rounded">
            {participant ? `${participant.firstName} ${participant.lastName}` : peerId}
          </span>
        </div>
      );
    }
    
    // Group call: show grid, local video as PiP
    console.log('[VIDEO] Rendering group call layout with', remoteEntries.length, 'participants');
    return (
      <div className="relative w-full grid grid-cols-2 gap-4">
        {remoteEntries.map(([peerId, stream]) => {
          const participant = connections.find(c => c._id === peerId);
          console.log('[VIDEO] Rendering participant video:', peerId, participant?.firstName);
          return (
            <div key={peerId} className="relative flex flex-col items-center">
              <video
                srcObject={stream}
                autoPlay
                playsInline
                className="w-full h-60 object-cover rounded-lg bg-black"
                onLoadedMetadata={() => console.log(`[VIDEO] Group video loaded metadata for ${peerId}`)}
                onCanPlay={() => console.log(`[VIDEO] Group video can play for ${peerId}`)}
                onError={(e) => console.error(`[VIDEO] Group video error for ${peerId}:`, e)}
              />
              <span className="absolute top-2 left-2 text-white bg-black bg-opacity-50 px-2 py-1 rounded">
                {participant ? `${participant.firstName} ${participant.lastName}` : peerId}
              </span>
            </div>
          );
        })}
        {/* Local video as PiP */}
        <div className="absolute bottom-4 right-4 w-32 h-24 bg-black rounded-lg border-2 border-white shadow-lg overflow-hidden">
          <video 
            ref={localVideoRef} 
            autoPlay 
            playsInline 
            muted 
            className="w-full h-full object-cover"
            onLoadedMetadata={() => console.log('[VIDEO] Local video loaded metadata (group)')}
            onCanPlay={() => console.log('[VIDEO] Local video can play (group)')}
            onError={(e) => console.error('[VIDEO] Local video error (group):', e)}
          />
        </div>
      </div>
    );
  };

  // UI for selecting participants
  const handleSelectParticipant = (id) => {
    setSelectedParticipants(prev =>
      prev.includes(id) ? prev.filter(pid => pid !== id) : [...prev, id]
    );
  };

  // Accept incoming call - refactored to match working example
  const acceptIncomingCall = async () => {
    setIsRinging(false);
    if (ringtoneRef.current) { ringtoneRef.current.pause(); ringtoneRef.current.currentTime = 0; }
    if (!incomingCall) return;
    try {
      const localStream = await navigator.mediaDevices.getUserMedia({ video: incomingCall.callType === 'video', audio: true });
      localStreamRef.current = localStream;
      if (localVideoRef.current) localVideoRef.current.srcObject = localStream;
      socket.emit('accept_call', { participantIds: incomingCall.participantIds, callId: incomingCall.callId || null });
      // Symmetrical: create peer connections and send offers to all others
      incomingCall.participantIds.forEach(pid => {
        if (pid !== user._id) createAndSendOffer(pid, localStream, incomingCall.participantIds, incomingCall.callId || null);
      });
      setIncomingCall(null);
      setInCall(true);
      setCallType(incomingCall.callType);
      setCallStatus('in-call');
      toast.success('Call accepted successfully!');
    } catch (error) {
      toast.error('Failed to accept call: ' + (error.message || error));
      endCallCleanup();
    }
  };

  // Decline incoming call
  const declineIncomingCall = () => {
    console.log('Declining incoming call...');
    setIsRinging(false);
    if (ringtoneRef.current) {
      ringtoneRef.current.pause();
      ringtoneRef.current.currentTime = 0;
    }
    
    if (incomingCall) {
      console.log('Notifying others of call decline...');
      socket.emit('decline_call', {
        participantIds: incomingCall.participantIds,
        callId: incomingCall.callId || null,
      });
      toast.info('Call declined');
    }
    setIncomingCall(null);
  };

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
            {connections.map(connection => (
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
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2">
                      {connection.firstName} {connection.lastName}
                    </h3>
                    <p className="text-sm text-gray-500 mb-4">
                      {connection.skills?.slice(0, 2).join(', ')}
                    </p>
                    <div className="flex items-center justify-center space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => quickCall(connection._id, 'audio')}
                      >
                        <Phone className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => quickCall(connection._id, 'video')}
                      >
                        <Video className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Call UI (show when inCall) */}
      {inCall && (
        <div className="fixed inset-0 flex flex-col items-center justify-center bg-black bg-opacity-80 z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-2xl">
            <h2 className="text-lg font-bold mb-2">{callType === 'video' ? 'Video Call' : 'Audio Call'}</h2>
            <div className="mb-4">{callStatus === 'calling' ? 'Calling...' : callStatus === 'in-call' ? 'In Call' : callStatus === 'ended' ? 'Call Ended' : ''}</div>
            {renderVideoLayout()}
            <div className="flex justify-center space-x-4 mt-4">
              <Button onClick={toggleMute} variant="outline">{isMuted ? 'Unmute' : 'Mute'}</Button>
              <Button onClick={toggleCamera} variant="outline">{isCameraOff ? 'Camera On' : 'Camera Off'}</Button>
              <Button onClick={endCallForAll} className="bg-red-600 text-white">End Call</Button>
            </div>
          </div>
        </div>
      )}

      {/* Incoming call modal */}
      {isRinging && incomingCall && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-8 rounded-lg shadow-lg text-center">
            <h2 className="text-xl font-bold mb-4">Incoming Call</h2>
            <p className="mb-4">You have an incoming group call.</p>
            <div className="flex justify-center space-x-4">
              <button onClick={acceptIncomingCall} className="bg-green-500 text-white px-4 py-2 rounded">Accept</button>
              <button onClick={declineIncomingCall} className="bg-red-500 text-white px-4 py-2 rounded">Decline</button>
            </div>
          </div>
        </div>
      )}

      {/* Participant selection UI */}
      <div className="mb-4">
        <h2 className="text-lg font-bold mb-2">Start Group Call</h2>
        <div className="flex flex-wrap gap-2">
          {connections.map(conn => (
            <button
              key={conn._id}
              onClick={() => handleSelectParticipant(conn._id)}
              className={`px-3 py-1 rounded-full border ${selectedParticipants.includes(conn._id) ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700'}`}
            >
              {conn.firstName} {conn.lastName}
            </button>
          ))}
        </div>
        <button
          onClick={() => startGroupCall()}
          className="mt-2 px-4 py-2 bg-blue-600 text-white rounded shadow"
          disabled={selectedParticipants.length === 0}
        >
          Start Call
        </button>
      </div>

      {/* Hidden audio element for ringtone */}
      <audio ref={ringtoneRef} src={RINGTONE_URL} loop />
    </div>
  );
};

export default Calls; 
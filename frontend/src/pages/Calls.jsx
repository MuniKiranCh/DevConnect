import React, { useState, useEffect } from 'react';
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

  useEffect(() => {
    fetchCallHistory();
  }, []);

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
    const otherParticipant = call.participants.find(p => p._id !== user._id);
    const isAcceptedConnection = acceptedConnections.some(conn => conn._id === otherParticipant._id);
    const matchesSearch = `${otherParticipant.firstName} ${otherParticipant.lastName}`.toLowerCase().includes(searchQuery.toLowerCase());
    return isAcceptedConnection && matchesSearch;
  });

  const CallHistoryItem = ({ call }) => {
    const otherParticipant = call.participants.find(p => p._id !== user._id);
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
            src={otherParticipant.photoUrl}
            alt={`${otherParticipant.firstName} ${otherParticipant.lastName}`}
            size="md"
          />
          <div>
            <h3 className="font-medium text-gray-900">
              {otherParticipant.firstName} {otherParticipant.lastName}
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
              onClick={() => initiateCall(otherParticipant._id, call.callType)}
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
          onClick={endCall}
          className="bg-red-600 hover:bg-red-700"
        >
          <PhoneOff className="h-5 w-5" />
        </Button>
      </div>
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
        <h1 className="text-2xl font-bold text-gray-900">Calls</h1>
        <p className="text-gray-600">Manage your video and audio calls</p>
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
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('history')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'history'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Clock className="h-4 w-4 inline mr-2" />
            Call History
          </button>
          <button
            onClick={() => setActiveTab('contacts')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'contacts'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <User className="h-4 w-4 inline mr-2" />
            Quick Call
          </button>
        </nav>
      </div>

      {/* Content */}
      <div className="space-y-6">
        {activeTab === 'history' && (
          <div className="space-y-4">
            {filteredCallHistory.length > 0 ? (
              filteredCallHistory.map(call => (
                <CallHistoryItem key={call._id} call={call} />
              ))
            ) : (
              <div className="text-center py-12">
                <Phone className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No call history</h3>
                <p className="text-gray-600">Start making calls to see your history here</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'contacts' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {acceptedConnections.length > 0 ? (
              acceptedConnections.map(connection => (
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
                          onClick={() => initiateCall(connection._id, 'audio')}
                        >
                          <Phone className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => initiateCall(connection._id, 'video')}
                        >
                          <Video className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No connections available</h3>
                <p className="text-gray-600">Connect with other developers to start calling them</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Call Controls (shown when in a call) */}
      {currentCall && <CallControls />}
    </div>
  );
};

export default Calls; 
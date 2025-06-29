import React, { useState, useEffect } from 'react';
import { UserPlus, Users, Clock, Check, X, Search } from 'lucide-react';
import { Card, CardContent, Button, Input, Avatar } from '../components/UI';
import { useConnectionsStore } from '../utils/store';
import { connectionAPI, profileAPI } from '../utils/api';
import toast from 'react-hot-toast';

const Connections = () => {
  const { connections, pendingRequests, setConnections, setPendingRequests } = useConnectionsStore();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('connections');
  const [suggestedUsers, setSuggestedUsers] = useState([]);

  useEffect(() => {
    fetchConnectionData();
  }, []);

  const fetchConnectionData = async () => {
    try {
      const [connectionsRes, pendingRes, suggestionsRes] = await Promise.all([
        connectionAPI.getConnections(),
        connectionAPI.getPendingRequests(),
        profileAPI.getSuggestions({ limit: 10 })
      ]);

      const connections = connectionsRes.data.connections || [];
      const pendingRequests = pendingRes.data.requests || [];
      const suggestedUsers = suggestionsRes.data.suggestedUsers || [];

      setConnections(connections);
      setPendingRequests(pendingRequests);
      setSuggestedUsers(suggestedUsers);
    } catch (error) {
      console.error('Failed to load connection data:', error);
      
      // Fallback to mock data
      const mockConnections = [
        {
          _id: '1',
          firstName: 'John',
          lastName: 'Doe',
          username: 'johndoe',
          photoUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
          bio: 'Full-stack developer passionate about React and Node.js',
          skills: ['React', 'Node.js', 'MongoDB'],
          location: 'San Francisco, CA'
        },
        {
          _id: '2',
          firstName: 'Sarah',
          lastName: 'Wilson',
          username: 'sarahdev',
          photoUrl: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
          bio: 'Python developer and data scientist',
          skills: ['Python', 'Django', 'PostgreSQL'],
          location: 'New York, NY'
        }
      ];
      
      const mockSuggestedUsers = [
        {
          _id: '3',
          firstName: 'Mike',
          lastName: 'Chen',
          username: 'mikechen',
          photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
          bio: 'Frontend developer specializing in React and TypeScript',
          skills: ['React', 'TypeScript', 'Next.js']
        },
        {
          _id: '4',
          firstName: 'Emily',
          lastName: 'Johnson',
          username: 'emilydev',
          photoUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
          bio: 'Mobile app developer with React Native',
          skills: ['React Native', 'JavaScript', 'Firebase']
        }
      ];
      
      setConnections(mockConnections);
      setPendingRequests([]);
      setSuggestedUsers(mockSuggestedUsers);
      
      toast.error('Failed to load connection data, showing mock data');
    } finally {
      setLoading(false);
    }
  };

  const handleSendRequest = async (userId) => {
    try {
      await connectionAPI.sendRequest(userId);
      toast.success('Connection request sent!');
      fetchConnectionData();
    } catch (error) {
      toast.error('Failed to send connection request');
    }
  };

  const handleAcceptRequest = async (requestId) => {
    try {
      await connectionAPI.acceptRequest(requestId);
      toast.success('Connection request accepted!');
      fetchConnectionData();
    } catch (error) {
      toast.error('Failed to accept request');
    }
  };

  const handleRejectRequest = async (requestId) => {
    try {
      await connectionAPI.rejectRequest(requestId);
      toast.success('Connection request rejected');
      fetchConnectionData();
    } catch (error) {
      toast.error('Failed to reject request');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading connections...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Connections</h1>
        <p className="text-gray-600">Manage your professional network</p>
      </div>

      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('connections')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'connections'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Users className="h-4 w-4 inline mr-2" />
            Connections ({connections.length})
          </button>
          <button
            onClick={() => setActiveTab('pending')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'pending'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Clock className="h-4 w-4 inline mr-2" />
            Pending ({pendingRequests.length})
          </button>
          <button
            onClick={() => setActiveTab('suggestions')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'suggestions'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <UserPlus className="h-4 w-4 inline mr-2" />
            Suggestions
          </button>
        </nav>
      </div>

      <div className="space-y-6">
        {activeTab === 'connections' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {connections.length > 0 ? (
              connections.map(connection => (
                <Card key={connection._id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-4">
                      <Avatar
                        src={connection.photoUrl}
                        alt={`${connection.firstName} ${connection.lastName}`}
                        size="lg"
                      />
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {connection.firstName} {connection.lastName}
                        </h3>
                        <p className="text-sm text-gray-600">@{connection.username}</p>
                        {connection.skills && connection.skills.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {connection.skills.slice(0, 3).map((skill, index) => (
                              <span
                                key={index}
                                className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                              >
                                {skill}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="col-span-2 text-center py-12">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No connections yet</h3>
                <p className="text-gray-600 mb-4">Start building your network by connecting with other developers</p>
                <Button onClick={() => setActiveTab('suggestions')}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Find People to Connect
                </Button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'pending' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {pendingRequests.length > 0 ? (
              pendingRequests.map(request => (
                <Card key={request._id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <Avatar
                          src={request.sender.photoUrl}
                          alt={`${request.sender.firstName} ${request.sender.lastName}`}
                          size="lg"
                        />
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {request.sender.firstName} {request.sender.lastName}
                          </h3>
                          <p className="text-sm text-gray-600">@{request.sender.username}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          onClick={() => handleAcceptRequest(request._id)}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <Check className="h-4 w-4 mr-1" />
                          Accept
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRejectRequest(request._id)}
                        >
                          <X className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="col-span-2 text-center py-12">
                <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No pending requests</h3>
                <p className="text-gray-600">You don't have any pending connection requests</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'suggestions' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {suggestedUsers.map(user => (
              <Card key={user._id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <Avatar
                        src={user.photoUrl}
                        alt={`${user.firstName} ${user.lastName}`}
                        size="lg"
                      />
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {user.firstName} {user.lastName}
                        </h3>
                        <p className="text-sm text-gray-600">@{user.username}</p>
                        {user.skills && user.skills.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {user.skills.slice(0, 3).map((skill, index) => (
                              <span
                                key={index}
                                className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                              >
                                {skill}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleSendRequest(user._id)}
                    >
                      <UserPlus className="h-4 w-4 mr-1" />
                      Connect
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Connections; 
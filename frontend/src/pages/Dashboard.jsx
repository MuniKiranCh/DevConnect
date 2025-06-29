import React, { useEffect, useState } from 'react';
import { 
  Users, 
  MessageSquare, 
  Phone, 
  UserPlus, 
  TrendingUp, 
  Calendar,
  MapPin,
  Github,
  Linkedin,
  Globe
} from 'lucide-react';
import { useAuthStore, useConnectionsStore, useMessagesStore, useCallsStore } from '../utils/store';
import { connectionAPI, messageAPI, callAPI } from '../utils/api';
import { Card, CardHeader, CardTitle, CardContent } from '../components/UI';
import { Avatar } from '../components/UI';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const user = useAuthStore((state) => state.user);
  const { connections, pendingRequests, setConnections, setPendingRequests } = useConnectionsStore();
  const { conversations, setConversations } = useMessagesStore();
  const { callHistory, setCallHistory } = useCallsStore();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalConnections: 0,
    pendingRequests: 0,
    totalMessages: 0,
    totalCalls: 0,
    growthRate: 0,
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [connectionsRes, pendingRes, conversationsRes, callsRes] = await Promise.all([
        connectionAPI.getConnections(),
        connectionAPI.getPendingRequests(),
        messageAPI.getConversations(),
        callAPI.getCallHistory(),
      ]);

      // Debug logging
      console.log('Connections response:', connectionsRes.data);
      console.log('Pending requests response:', pendingRes.data);
      console.log('Conversations response:', conversationsRes.data);
      console.log('Calls response:', callsRes.data);

      // Handle API responses properly
      const connections = connectionsRes.data.connections || [];
      const pendingRequests = pendingRes.data.requests || [];
      const conversations = conversationsRes.data.conversations || [];
      const calls = callsRes.data.calls || [];

      setConnections(connections);
      setPendingRequests(pendingRequests);
      setConversations(conversations);
      setCallHistory(calls);
      
      setStats({
        totalConnections: connections.length,
        pendingRequests: pendingRequests.length,
        totalMessages: conversations.length,
        totalCalls: calls.length,
        growthRate: 12.5, // Mock data
      });
    } catch (error) {
      console.error('Dashboard data fetch error:', error);
      
      // Fallback to mock data if API fails
      const mockConnections = [
        {
          _id: '1',
          firstName: 'John',
          lastName: 'Doe',
          photoUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
          skills: ['React', 'Node.js']
        },
        {
          _id: '2',
          firstName: 'Sarah',
          lastName: 'Wilson',
          photoUrl: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
          skills: ['Python', 'Django']
        }
      ];
      
      const mockConversations = [
        {
          _id: '1',
          user: {
            firstName: 'John',
            lastName: 'Doe',
            photoUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face'
          },
          lastMessage: {
            content: 'Hey, how are you doing?',
            createdAt: new Date()
          }
        }
      ];
      
      setConnections(mockConnections);
      setPendingRequests([]);
      setConversations(mockConversations);
      setCallHistory([]);
      
      setStats({
        totalConnections: mockConnections.length,
        pendingRequests: 0,
        totalMessages: mockConversations.length,
        totalCalls: 0,
        growthRate: 12.5,
      });
      
      toast.error('Failed to load dashboard data, showing mock data');
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, icon: Icon, color = 'primary' }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
          </div>
          <div className={`p-3 rounded-full bg-${color}-100`}>
            <Icon className={`h-6 w-6 text-${color}-600`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const RecentConnection = ({ connection }) => (
    <div className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
      <Avatar
        src={connection.photoUrl}
        alt={`${connection.firstName} ${connection.lastName}`}
        size="md"
        status="online"
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">
          {connection.firstName} {connection.lastName}
        </p>
        <p className="text-xs text-gray-500 truncate">
          {connection.skills?.slice(0, 2).join(', ')}
        </p>
      </div>
    </div>
  );

  const RecentMessage = ({ conversation }) => (
    <div className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
      <Avatar
        src={conversation.user?.avatar}
        alt={`${conversation.user?.firstName} ${conversation.user?.lastName}`}
        size="md"
        status="online"
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">
          {conversation.user?.firstName} {conversation.user?.lastName}
        </p>
        <p className="text-xs text-gray-500 truncate">
          {conversation.lastMessage?.content || 'No messages yet'}
        </p>
      </div>
      <div className="text-xs text-gray-400">
        {conversation.lastMessage?.createdAt ? 
          new Date(conversation.lastMessage.createdAt).toLocaleDateString() : 
          'New'
        }
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">
          Welcome back, {user?.firstName}!
        </h1>
        <p className="text-blue-100">
          Here's what's happening in your DevConnect network today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Connections"
          value={stats.totalConnections}
          icon={Users}
          color="blue"
        />
        <StatCard
          title="Pending Requests"
          value={stats.pendingRequests}
          icon={UserPlus}
          color="yellow"
        />
        <StatCard
          title="Total Messages"
          value={stats.totalMessages}
          icon={MessageSquare}
          color="green"
        />
        <StatCard
          title="Total Calls"
          value={stats.totalCalls}
          icon={Phone}
          color="purple"
        />
        <StatCard
          title="Growth Rate"
          value={`${stats.growthRate}%`}
          icon={TrendingUp}
          color="orange"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Overview */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Your Profile</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-4">
                <Avatar
                  src={user?.avatar}
                  alt={`${user?.firstName} ${user?.lastName}`}
                  size="xl"
                  status="online"
                />
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {user?.firstName} {user?.lastName}
                  </h3>
                  <p className="text-sm text-gray-600">@{user?.username}</p>
                  {user?.location && (
                    <p className="text-xs text-gray-500 flex items-center mt-1">
                      <MapPin className="h-3 w-3 mr-1" />
                      {user.location}
                    </p>
                  )}
                </div>
              </div>
              
              {user?.bio && (
                <p className="text-sm text-gray-600">{user.bio}</p>
              )}
              
              {user?.skills && user.skills.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Skills</h4>
                  <div className="flex flex-wrap gap-2">
                    {user.skills.slice(0, 5).map((skill, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full"
                      >
                        {skill}
                      </span>
                    ))}
                    {user.skills.length > 5 && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                        +{user.skills.length - 5} more
                      </span>
                    )}
                  </div>
                </div>
              )}
              
              <div className="flex space-x-3 pt-2">
                {user?.github && (
                  <a
                    href={user.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    <Github className="h-5 w-5" />
                  </a>
                )}
                {user?.linkedin && (
                  <a
                    href={user.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-secondary-500 hover:text-secondary-700 transition-colors"
                  >
                    <Linkedin className="h-5 w-5" />
                  </a>
                )}
                {user?.website && (
                  <a
                    href={user.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-secondary-500 hover:text-secondary-700 transition-colors"
                  >
                    <Globe className="h-5 w-5" />
                  </a>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <div className="lg:col-span-2 space-y-6">
          {/* Recent Connections */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Connections</CardTitle>
            </CardHeader>
            <CardContent>
              {connections.length > 0 ? (
                <div className="space-y-2">
                  {connections.slice(0, 5).map((connection) => (
                    <RecentConnection key={connection._id} connection={connection} />
                  ))}
                </div>
              ) : (
                <p className="text-secondary-500 text-center py-4">
                  No connections yet. Start connecting with other developers!
                </p>
              )}
            </CardContent>
          </Card>

          {/* Recent Messages */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Messages</CardTitle>
            </CardHeader>
            <CardContent>
              {conversations.length > 0 ? (
                <div className="space-y-2">
                  {conversations.slice(0, 5).map((conversation) => (
                    <RecentMessage key={conversation._id} conversation={conversation} />
                  ))}
                </div>
              ) : (
                <p className="text-secondary-500 text-center py-4">
                  No recent messages. Start a conversation!
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 
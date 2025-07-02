import React, { useState, useEffect, useRef } from 'react';
import { Send, Search, MoreVertical, Phone, Video, Image, Paperclip, Smile, Mic, CheckCheck, MessageSquare, Users } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Button, Input, Avatar } from '../components/UI';
import { useMessagesStore, useAuthStore } from '../utils/store';
import { messageAPI, connectionAPI } from '../utils/api';
import toast from 'react-hot-toast';
import socketService from '../utils/socket';

const Messages = () => {
  const { user } = useAuthStore();
  const { messages, setMessages, addMessage } = useMessagesStore();

  const [connections, setConnections] = useState([]);
  const [selectedConnection, setSelectedConnection] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef(null);

  // Fetch connections once on mount
  useEffect(() => {
    const fetchConnections = async () => {
      try {
        const response = await connectionAPI.getConnections();
        setConnections(response.data.connections || []);
        if (response.data.connections?.length > 0) {
          setSelectedConnection(response.data.connections[0]);
        }
      } catch (error) {
        toast.error('Failed to load connections');
      } finally {
        setLoading(false);
      }
    };
    fetchConnections();
  }, []);

  // Fetch messages when a connection is selected
  useEffect(() => {
    if (selectedConnection) {
      fetchMessages(selectedConnection._id);
    }
    // eslint-disable-next-line
  }, [selectedConnection]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, selectedConnection]);

  // Real-time: Join socket room and listen for new messages
  useEffect(() => {
    const socket = socketService.getSocket();
    if (!socket || !user?._id) return;

    // Join user room
    socket.emit('join', user._id);
    
    socket.on('new_message', (data) => {
      // data: { senderId, message }
      // Only add if the message is for the currently selected connection
      if (selectedConnection && data.senderId === selectedConnection._id) {
        addMessage(selectedConnection._id, {
          sender: data.senderId,
          content: data.message,
          createdAt: new Date().toISOString(),
        });
      }
    });
    
    return () => {
      socket.off('new_message');
    };
  }, [user, selectedConnection, addMessage]);

  const fetchMessages = async (userId) => {
    try {
      const response = await messageAPI.getConversation(userId);
      setMessages(userId, response.data.messages || []);
    } catch (error) {
      toast.error('Failed to load messages');
      setMessages(userId, []);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConnection) return;
    
    const socket = socketService.getSocket();
    if (!socket) {
      toast.error('Connection not available');
      return;
    }
    
    // Optimistically add message to UI
    addMessage(selectedConnection._id, {
      sender: user._id,
      content: newMessage,
      createdAt: new Date().toISOString(),
    });
    
    // Emit via socket for real-time delivery
    socket.emit('send_message', {
      receiverId: selectedConnection._id,
      message: newMessage,
    });
    
    setNewMessage('');
    
    // Optionally, still save to DB via API (optional, or move to backend on socket event)
    try {
      await messageAPI.sendMessage(selectedConnection._id, {
        content: newMessage,
        type: 'text'
      });
    } catch (error) {
      toast.error('Failed to send message');
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatTime = (date) => {
    if (!date) return '';
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Filter connections by search
  const filteredConnections = connections.filter(con =>
    `${con.firstName} ${con.lastName}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Sidebar item for each connection
  const ConnectionItem = ({ connection }) => {
    const isSelected = selectedConnection?._id === connection._id;
    const currentMessages = messages[connection._id] || [];
    const lastMessage = currentMessages[currentMessages.length - 1];

    return (
      <div
        onClick={() => setSelectedConnection(connection)}
        className={`flex items-center space-x-3 p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
          isSelected ? 'bg-blue-50 border-r-2 border-blue-500' : ''
        }`}
      >
        <div className="relative">
          <Avatar
            src={connection.photoUrl}
            alt={`${connection.firstName} ${connection.lastName}`}
            size="md"
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-900 truncate">
              {connection.firstName} {connection.lastName}
            </h3>
            {lastMessage && (
              <span className="text-xs text-gray-500">
                {formatTime(lastMessage.createdAt)}
              </span>
            )}
          </div>
          {lastMessage && (
            <p className="text-xs text-gray-500 truncate">
              {lastMessage.sender === user._id ? 'You: ' : ''}
              {lastMessage.content}
            </p>
          )}
        </div>
      </div>
    );
  };

  const MessageBubble = ({ message }) => {
    const isOwnMessage = message.sender === user._id;
    // Try to get sender name from message, fallback to selectedConnection for incoming
    const senderName = isOwnMessage
      ? ''
      : (message.sender?.firstName && message.sender?.lastName)
        ? `${message.sender.firstName} ${message.sender.lastName}`
        : (selectedConnection ? `${selectedConnection.firstName} ${selectedConnection.lastName}` : '');
    return (
      <div className={`mb-4 flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
        <div className="max-w-xs lg:max-w-md flex flex-col items-start">
          {/* Time and (if incoming) sender name */}
          <div className={`mb-1 text-xs text-gray-500 ${isOwnMessage ? 'text-right self-end' : 'text-left'}`}>
            {!isOwnMessage && (
              <span className="font-medium mr-2">{senderName}</span>
            )}
            {formatTime(message.createdAt)}
          </div>
          {/* Message bubble */}
          <div className={`px-4 py-2 rounded-lg ${isOwnMessage ? 'bg-blue-100 text-gray-900 self-end' : 'bg-gray-100 text-gray-900 self-start'}`}>
            <span>{message.content}</span>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading messages...</div>
      </div>
    );
  }

  if (connections.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No connections yet</h3>
          <p className="text-gray-600 mb-4">
            You need to have accepted connections to send and receive messages. 
            Connect with other developers to start messaging.
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
    <div className="h-full flex">
      {/* Connections Sidebar */}
      <div className="w-80 border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-900 mb-4">Messages</h1>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search connections..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {filteredConnections.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              No connections found
            </div>
          ) : (
            filteredConnections.map(connection => (
              <ConnectionItem key={connection._id} connection={connection} />
            ))
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedConnection ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Avatar
                  src={selectedConnection.photoUrl}
                  alt={`${selectedConnection.firstName} ${selectedConnection.lastName}`}
                  size="md"
                />
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    {selectedConnection.firstName} {selectedConnection.lastName}
                  </h2>
                  <span className="text-gray-500">@{selectedConnection.username}</span>
                  {/* You can add online status here if you have it */}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Button size="sm" variant="outline">
                  <Phone className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="outline">
                  <Video className="h-4 w-4" />
                </Button>
                <button className="p-2 hover:bg-gray-100 rounded-full">
                  <MoreVertical className="h-4 w-4 text-gray-500" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages[selectedConnection._id]?.map((message, index) => (
                <MessageBubble key={message._id || index} message={message} />
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-gray-200">
              <div className="flex items-end space-x-2">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    {/* <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors">
                      <Paperclip className="h-4 w-4" />
                    </button>
                    <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors">
                      <Image className="h-4 w-4" />
                    </button>
                    <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors">
                      <Smile className="h-4 w-4" />
                    </button> */}
                  </div>
                  <textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), sendMessage())}
                    placeholder="Type a message..."
                    className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={1}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors">
                    <Mic className="h-4 w-4" />
                  </button>
                  <Button onClick={sendMessage} disabled={!newMessage.trim()}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Select a connection</h3>
              <p className="text-gray-600">Choose a connection from the sidebar to start messaging</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Messages;
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const connectDB = require('./config/database');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*", // In production, set to your frontend URL
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"]
    }
});

app.use(cors({
  origin: '*'
}));

require('dotenv').config();
app.use(express.json());

const port = process.env.PORT || 3000;

const authRouter = require('./routes/authRoutes');
const profileRouter = require('./routes/profileRoutes');
const requestRouter = require('./routes/requestRouter');
const messageRouter = require('./routes/messageRoutes');
const callRouter = require('./routes/callRoutes');

app.use('/api/auth', authRouter);
app.use('/api/profile', profileRouter);
app.use('/api/request', requestRouter);
app.use('/api/messages', messageRouter);
app.use('/api/calls', callRouter);

// Debug endpoint to check online users
app.get('/api/debug/online-users', (req, res) => {
    const onlineUsers = Array.from(connectedUsers.entries()).map(([userId, socketId]) => ({
        userId,
        socketId,
        connected: io.sockets.sockets.has(socketId)
    }));
    
    res.json({
        totalConnected: connectedUsers.size,
        onlineUsers,
        activeCalls: Array.from(activeCalls.entries())
    });
});

// Socket.io connection handling
const connectedUsers = new Map(); // userId -> socketId
const activeCalls = new Map(); // callId -> {caller, receiver}

// Socket authentication middleware
io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    
    console.log(`[SOCKET AUTH] Attempting authentication for socket ${socket.id}`);
    console.log(`[SOCKET AUTH] Token provided: ${token ? 'Yes' : 'No'}`);
    
    if (!token) {
        console.error(`[SOCKET AUTH] No token provided for socket ${socket.id}`);
        return next(new Error('Authentication error: No token provided'));
    }
    
    if (!process.env.JWT_SECRET) {
        console.error('[SOCKET AUTH] JWT_SECRET not configured');
        return next(new Error('Authentication error: Server configuration error'));
    }
    
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log(`[SOCKET AUTH] Successfully authenticated user ${decoded.userId} for socket ${socket.id}`);
        socket.userId = decoded.userId;
        socket.user = decoded;
        next();
    } catch (error) {
        console.error(`[SOCKET AUTH] Token verification failed for socket ${socket.id}:`, error.message);
        console.error(`[SOCKET AUTH] Token: ${token.substring(0, 20)}...`);
        return next(new Error(`Authentication error: ${error.message}`));
    }
});

io.on('connection', (socket) => {
    console.log(`[SOCKET] User connected: ${socket.id} (User ID: ${socket.userId})`);

    // User joins with their userId
    socket.on('join', (userId) => {
        console.log(`[SOCKET] Join event received for user ${userId} on socket ${socket.id}`);
        
        // Verify the userId matches the authenticated user
        if (userId !== socket.userId) {
            console.error(`[SOCKET] User ID mismatch: ${userId} vs ${socket.userId}`);
            return;
        }
        
        // Remove any existing connection for this user
        const existingSocketId = connectedUsers.get(userId);
        if (existingSocketId && existingSocketId !== socket.id) {
            console.log(`[SOCKET] Removing existing connection for user ${userId}: ${existingSocketId}`);
            const existingSocket = io.sockets.sockets.get(existingSocketId);
            if (existingSocket) {
                existingSocket.disconnect(true);
            }
        }
        
        connectedUsers.set(userId, socket.id);
        console.log(`[SOCKET] User ${userId} joined with socket ${socket.id}`);
        console.log(`[SOCKET] Total connected users: ${connectedUsers.size}`);
        console.log(`[SOCKET] Connected users map:`, Array.from(connectedUsers.entries()));
        
        // Send confirmation to the user that they've successfully joined
        socket.emit('joined_room', { userId, socketId: socket.id });
    });

    // Handle new message
    socket.on('send_message', (data) => {
        const { receiverId, message } = data;
        const receiverSocketId = connectedUsers.get(receiverId);
        if (receiverSocketId) {
            io.to(receiverSocketId).emit('new_message', {
                senderId: socket.userId,
                message: message
            });
            console.log(`[SOCKET] Message sent from ${socket.userId} to ${receiverId}`);
        }
    });

    // Handle typing indicator
    socket.on('typing', (data) => {
        const { receiverId, isTyping } = data;
        const receiverSocketId = connectedUsers.get(receiverId);
        if (receiverSocketId) {
            io.to(receiverSocketId).emit('user_typing', {
                senderId: socket.userId,
                isTyping: isTyping
            });
        }
    });

    // 1:1 Call Signaling
    socket.on('initiate_call', async (data) => {
        const { receiverId, callType, callId } = data;
        // Only notify the receiver, do not create the call in the DB here
        const receiverSocketId = connectedUsers.get(receiverId);
        if (receiverSocketId) {
            io.to(receiverSocketId).emit('incoming_call', {
                callerId: socket.userId,
                callType: callType || 'video',
                callId
            });
            console.log(`[SOCKET] Incoming call sent to ${receiverId}`);
        } else {
            io.to(socket.id).emit('call_participant_offline', {
                message: 'User is not online'
            });
        }
    });

    socket.on('accept_call', async (data) => {
        const { callerId, callType, callId } = data;
        console.log(`[SOCKET] Call accepted by ${socket.userId}`);
        const Call = require('./models/callModel');
        let call = await Call.findOne({ callId });
        if (call) {
          call.status = 'accepted';
          call.startTime = new Date();
          await call.save();
        }
        const callerSocketId = connectedUsers.get(callerId);
        if (callerSocketId) {
            io.to(callerSocketId).emit('call_accepted', {
                receiverId: socket.userId,
                callType: callType || 'video',
                callId
            });
            console.log(`[SOCKET] Call accepted event sent to ${callerId}`);
        }
        io.to(socket.id).emit('call_updated', { callId, status: 'accepted' });
        if (callerSocketId) {
            io.to(callerSocketId).emit('call_updated', { callId, status: 'accepted' });
        }
    });

    socket.on('decline_call', async (data) => {
        const { callerId, callType, callId } = data;
        console.log(`[SOCKET] Call declined by ${socket.userId}`);
        const Call = require('./models/callModel');
        let call = await Call.findOne({ callId });
        if (call) {
          call.status = 'declined';
          await call.save();
        }
        const callerSocketId = connectedUsers.get(callerId);
        if (callerSocketId) {
            io.to(callerSocketId).emit('call_declined', {
                receiverId: socket.userId,
                callType: callType || 'video',
                callId
            });
            console.log(`[SOCKET] Call declined event sent to ${callerId}`);
        }
        io.to(socket.id).emit('call_updated', { callId, status: 'declined' });
        if (callerSocketId) {
            io.to(callerSocketId).emit('call_updated', { callId, status: 'declined' });
        }
    });

    socket.on('end_call', async (data) => {
        const { receiverId, callType, callId } = data;
        console.log(`[SOCKET] Call ended by ${socket.userId}`);
        const Call = require('./models/callModel');
        let call = await Call.findOne({ callId });
        if (call && call.status === 'accepted') {
          call.status = 'ended';
          call.endTime = new Date();
          if (call.startTime) {
            call.duration = Math.floor((call.endTime - call.startTime) / 1000);
          }
          await call.save();
        }
        const senderUserId = socket.userId;
        const receiverUserId = receiverId;
        const senderSocketId = connectedUsers.get(senderUserId);
        const receiverSocketId = connectedUsers.get(receiverUserId);
        if (senderSocketId) {
            io.to(senderSocketId).emit('call_ended', {
                callerId: senderUserId,
                callType: callType || 'video',
                callId
            });
            console.log(`[SOCKET] Call ended event sent to sender ${senderUserId}`);
        }
        if (receiverSocketId) {
            io.to(receiverSocketId).emit('call_ended', {
                callerId: senderUserId,
                callType: callType || 'video',
                callId
            });
            console.log(`[SOCKET] Call ended event sent to receiver ${receiverUserId}`);
        }
        if (senderSocketId) {
            io.to(senderSocketId).emit('call_updated', { callId, status: 'ended' });
        }
        if (receiverSocketId) {
            io.to(receiverSocketId).emit('call_updated', { callId, status: 'ended' });
        }
    });

    // WebRTC Signaling for 1:1 calls
    socket.on('webrtc_offer', (data) => {
        const { receiverId, offer, callType } = data;
        console.log(`[SOCKET] WebRTC offer from ${socket.userId} to ${receiverId}`);
        
        const receiverSocketId = connectedUsers.get(receiverId);
        if (receiverSocketId) {
            io.to(receiverSocketId).emit('webrtc_offer', {
                callerId: socket.userId,
                offer: offer,
                callType: callType || 'video',
            });
            console.log(`[SOCKET] WebRTC offer sent to ${receiverId}`);
        }
    });

    socket.on('webrtc_answer', (data) => {
        const { callerId, answer, callType } = data;
        console.log(`[SOCKET] WebRTC answer from ${socket.userId} to ${callerId}`);
        
        const callerSocketId = connectedUsers.get(callerId);
        if (callerSocketId) {
            io.to(callerSocketId).emit('webrtc_answer', {
                receiverId: socket.userId,
                answer: answer,
                callType: callType || 'video',
            });
            console.log(`[SOCKET] WebRTC answer sent to ${callerId}`);
        }
    });

    socket.on('ice_candidate', (data) => {
        const { receiverId, candidate, callType } = data;
        console.log(`[SOCKET] ICE candidate from ${socket.userId} to ${receiverId}`);
        
        const receiverSocketId = connectedUsers.get(receiverId);
        if (receiverSocketId) {
            io.to(receiverSocketId).emit('ice_candidate', {
                senderId: socket.userId,
                candidate: candidate,
                callType: callType || 'video',
            });
            console.log(`[SOCKET] ICE candidate sent to ${receiverId}`);
        }
    });

    // Handle disconnect
    socket.on('disconnect', () => {
        if (socket.userId) {
            // Only remove if this is the current connection for the user
            const currentSocketId = connectedUsers.get(socket.userId);
            if (currentSocketId === socket.id) {
                connectedUsers.delete(socket.userId);
                console.log(`[SOCKET] User ${socket.userId} disconnected (socket ${socket.id})`);
                console.log(`[SOCKET] Total connected users: ${connectedUsers.size}`);
            } else {
                console.log(`[SOCKET] User ${socket.userId} disconnected old socket ${socket.id} (current: ${currentSocketId})`);
            }
        } else {
            console.log(`[SOCKET] Unauthenticated user disconnected (socket ${socket.id})`);
        }
    });

    // Handle authentication errors
    socket.on('error', (error) => {
        console.error(`[SOCKET] Socket error for ${socket.id}:`, error.message);
    });
});

// Make io available to routes
app.set('io', io);

// Fix: Call connectDB as an async function
const startServer = async () => {
    try {
        await connectDB();
        console.log('Database connected successfully');
        server.listen(port, () => {
            console.log(`Server is running on PORT ${port}`);
            console.log(`Socket.io server is ready for real-time messaging and video calls`);
        });
    } catch (error) {
        console.error('Database connection error:', error);
        process.exit(1);
    }
};

startServer();

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const connectDB = require('./config/database');
const cors = require('cors');
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*", // In production, set to your frontend URL
        methods: ["GET", "POST"]
    }
});

require('dotenv').config();
app.use(express.json());
app.use(cors({
  origin: 'http://localhost:5173'
}));

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

// Socket.io connection handling
const connectedUsers = new Map(); // userId -> socketId
const activeCalls = new Map(); // callId -> {caller, receiver}

io.on('connection', (socket) => {
    // console.log('User connected:', socket.id);

    // User joins with their userId
    socket.on('join', (userId) => {
        connectedUsers.set(userId, socket.id);
        socket.userId = userId;
        // console.log(`User ${userId} joined with socket ${socket.id}`);
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
            console.log(`Message sent from ${socket.userId} to ${receiverId}`);
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

    // WebRTC Video Call Signaling
    socket.on('initiate_call', (data) => {
        const { receiverId, callType } = data;
        const receiverSocketId = connectedUsers.get(receiverId);
        
        if (receiverSocketId) {
            io.to(receiverSocketId).emit('incoming_call', {
                callerId: socket.userId,
                callType: callType || 'video'
            });
            console.log(`Call initiated from ${socket.userId} to ${receiverId}`);
        }
    });

    socket.on('accept_call', (data) => {
        const { callerId, callId } = data;
        const callerSocketId = connectedUsers.get(callerId);
        
        if (callerSocketId) {
            io.to(callerSocketId).emit('call_accepted', {
                receiverId: socket.userId,
                callId: callId
            });
            console.log(`Call accepted by ${socket.userId} from ${callerId}`);
        }
    });

    socket.on('decline_call', (data) => {
        const { callerId, callId } = data;
        const callerSocketId = connectedUsers.get(callerId);
        
        if (callerSocketId) {
            io.to(callerSocketId).emit('call_declined', {
                receiverId: socket.userId,
                callId: callId
            });
            console.log(`Call declined by ${socket.userId} from ${callerId}`);
        }
    });

    socket.on('end_call', (data) => {
        const { receiverId, callId } = data;
        const receiverSocketId = connectedUsers.get(receiverId);
        
        if (receiverSocketId) {
            io.to(receiverSocketId).emit('call_ended', {
                callerId: socket.userId,
                callId: callId
            });
            console.log(`Call ended by ${socket.userId} with ${receiverId}`);
        }
    });

    // WebRTC Signaling
    socket.on('webrtc_offer', (data) => {
        const { receiverId, offer, callId } = data;
        const receiverSocketId = connectedUsers.get(receiverId);
        
        if (receiverSocketId) {
            io.to(receiverSocketId).emit('webrtc_offer', {
                callerId: socket.userId,
                offer: offer,
                callId: callId
            });
            console.log(`WebRTC offer sent from ${socket.userId} to ${receiverId}`);
        }
    });

    socket.on('webrtc_answer', (data) => {
        const { callerId, answer, callId } = data;
        const callerSocketId = connectedUsers.get(callerId);
        
        if (callerSocketId) {
            io.to(callerSocketId).emit('webrtc_answer', {
                receiverId: socket.userId,
                answer: answer,
                callId: callId
            });
            console.log(`WebRTC answer sent from ${socket.userId} to ${callerId}`);
        }
    });

    socket.on('ice_candidate', (data) => {
        const { receiverId, candidate, callId } = data;
        const receiverSocketId = connectedUsers.get(receiverId);
        
        if (receiverSocketId) {
            io.to(receiverSocketId).emit('ice_candidate', {
                senderId: socket.userId,
                candidate: candidate,
                callId: callId
            });
            console.log(`ICE candidate sent from ${socket.userId} to ${receiverId}`);
        }
    });

    // Handle disconnect
    socket.on('disconnect', () => {
        if (socket.userId) {
            connectedUsers.delete(socket.userId);
            console.log(`User ${socket.userId} disconnected`);
        }
        // console.log('User disconnected:', socket.id);
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

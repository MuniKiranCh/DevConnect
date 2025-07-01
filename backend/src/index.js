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
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"]
    }
});

app.options('*', cors()); 

require('dotenv').config();
app.use(express.json());
app.use(cors({
  origin: true
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
    console.log(`[SOCKET] User connected: ${socket.id}`);

    // User joins with their userId
    socket.on('join', (userId) => {
        connectedUsers.set(userId, socket.id);
        socket.userId = userId;
        console.log(`[SOCKET] User ${userId} joined with socket ${socket.id}`);
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

    // WebRTC Group Call Signaling
    socket.on('initiate_call', (data) => {
        const { participantIds, callType } = data; // participantIds: array of userIds
        console.log(`[SOCKET] Call initiated by ${socket.userId} to participants:`, participantIds);
        let allParticipantsOnline = true;
        const offlineParticipants = [];
        if (Array.isArray(participantIds)) {
            participantIds.forEach(pid => {
                if (pid !== socket.userId) {
                    const receiverSocketId = connectedUsers.get(pid);
                    if (receiverSocketId) {
                        io.to(receiverSocketId).emit('incoming_call', {
                            callerId: socket.userId,
                            callType: callType || 'video',
                            participantIds
                        });
                        console.log(`[SOCKET] Incoming call sent to ${pid}`);
                    } else {
                        console.log(`[SOCKET] User ${pid} not connected`);
                        offlineParticipants.push(pid);
                        allParticipantsOnline = false;
                    }
                }
            });
            if (!allParticipantsOnline) {
                io.to(socket.id).emit('call_participants_offline', {
                    offlineParticipants,
                    message: 'Some participants are not online'
                });
            }
        }
    });

    socket.on('accept_call', (data) => {
        const { participantIds, callId } = data;
        console.log(`[SOCKET] Call accepted by ${socket.userId}`);
        if (Array.isArray(participantIds)) {
            participantIds.forEach(pid => {
                if (pid !== socket.userId) {
                    const receiverSocketId = connectedUsers.get(pid);
                    if (receiverSocketId) {
                        io.to(receiverSocketId).emit('call_accepted', {
                            receiverId: socket.userId,
                            callId: callId,
                            participantIds
                        });
                        console.log(`[SOCKET] Call accepted event sent to ${pid}`);
                    }
                }
            });
        }
    });

    socket.on('decline_call', (data) => {
        const { participantIds, callId } = data;
        console.log(`[SOCKET] Call declined by ${socket.userId}`);
        if (Array.isArray(participantIds)) {
            participantIds.forEach(pid => {
                if (pid !== socket.userId) {
                    const receiverSocketId = connectedUsers.get(pid);
                    if (receiverSocketId) {
                        io.to(receiverSocketId).emit('call_declined', {
                            receiverId: socket.userId,
                            callId: callId,
                            participantIds
                        });
                        console.log(`[SOCKET] Call declined event sent to ${pid}`);
                    }
                }
            });
        }
    });

    socket.on('end_call', (data) => {
        const { participantIds, callId } = data;
        console.log(`[SOCKET] Call ended by ${socket.userId}`);
        if (Array.isArray(participantIds)) {
            participantIds.forEach(pid => {
                if (pid !== socket.userId) {
                    const receiverSocketId = connectedUsers.get(pid);
                    if (receiverSocketId) {
                        io.to(receiverSocketId).emit('call_ended', {
                            callerId: socket.userId,
                            callId: callId,
                            participantIds
                        });
                        console.log(`[SOCKET] Call ended event sent to ${pid}`);
                    }
                }
            });
        }
    });

    // WebRTC Signaling for group
    socket.on('webrtc_offer', (data) => {
        const { participantIds, offer, callId } = data;
        console.log(`[SOCKET] WebRTC offer from ${socket.userId} to participants:`, participantIds);
        if (Array.isArray(participantIds)) {
            participantIds.forEach(pid => {
                if (pid !== socket.userId) {
                    const receiverSocketId = connectedUsers.get(pid);
                    if (receiverSocketId) {
                        io.to(receiverSocketId).emit('webrtc_offer', {
                            callerId: socket.userId,
                            offer: offer,
                            callId: callId,
                            participantIds
                        });
                        console.log(`[SOCKET] WebRTC offer sent to ${pid}`);
                    }
                }
            });
        }
    });

    socket.on('webrtc_answer', (data) => {
        const { participantIds, answer, callId } = data;
        console.log(`[SOCKET] WebRTC answer from ${socket.userId} to participants:`, participantIds);
        if (Array.isArray(participantIds)) {
            participantIds.forEach(pid => {
                if (pid !== socket.userId) {
                    const receiverSocketId = connectedUsers.get(pid);
                    if (receiverSocketId) {
                        io.to(receiverSocketId).emit('webrtc_answer', {
                            receiverId: socket.userId,
                            answer: answer,
                            callId: callId,
                            participantIds
                        });
                        console.log(`[SOCKET] WebRTC answer sent to ${pid}`);
                    }
                }
            });
        }
    });

    socket.on('ice_candidate', (data) => {
        const { participantIds, candidate, callId } = data;
        console.log(`[SOCKET] ICE candidate from ${socket.userId} to participants:`, participantIds, candidate);
        if (Array.isArray(participantIds)) {
            participantIds.forEach(pid => {
                if (pid !== socket.userId) {
                    const receiverSocketId = connectedUsers.get(pid);
                    if (receiverSocketId) {
                        io.to(receiverSocketId).emit('ice_candidate', {
                            senderId: socket.userId,
                            candidate: candidate,
                            callId: callId,
                            participantIds
                        });
                        console.log(`[SOCKET] ICE candidate sent to ${pid}`);
                    }
                }
            });
        }
    });

    // Handle disconnect
    socket.on('disconnect', () => {
        if (socket.userId) {
            connectedUsers.delete(socket.userId);
            console.log(`[SOCKET] User ${socket.userId} disconnected (socket ${socket.id})`);
        }
    });
});

// Make io available to routes
app.set('io', io);

// Fix: Call connectDB as an async function
const startServer = async () => {
    try {
        await connectDB();
        console.log('Database connected successfully');
        server.listen(port, '0.0.0.0', () => {
            console.log(`Server is running on PORT ${port}`);
            console.log(`Socket.io server is ready for real-time messaging and video calls`);
        });
    } catch (error) {
        console.error('Database connection error:', error);
        process.exit(1);
    }
};

startServer();

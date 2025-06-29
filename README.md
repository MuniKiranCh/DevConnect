# DevConnect - Professional Developer Networking Platform

A full-stack web application for developers to connect, network, and collaborate. Built with modern technologies and following industry best practices.

## 🚀 Features

### Core Functionality
- **Professional Networking**: LinkedIn-style connection system for developers
- **User Authentication**: Secure JWT-based authentication system
- **Profile Management**: Comprehensive user profiles with skills and experience
- **Connection Requests**: Send, accept, and reject professional connections
- **Real-time Messaging**: Instant messaging between connected users
- **Video/Audio Calls**: WebRTC-based calling with both audio and video support
- **User Discovery**: Search and discover other developers by skills and location

### Technical Features
- **RESTful API Design**: Clean, scalable API architecture with proper controller separation
- **Database Integration**: MongoDB with Mongoose ODM
- **Real-time Communication**: Socket.io for messaging and call signaling
- **WebRTC Integration**: Peer-to-peer video/audio calling
- **Security**: JWT authentication, password hashing, input validation
- **Error Handling**: Comprehensive error handling and validation
- **Middleware Implementation**: Custom authentication and validation middleware

## 🛠️ Tech Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - NoSQL database
- **Mongoose** - Object Data Modeling
- **Socket.io** - Real-time communication
- **WebRTC** - Peer-to-peer video/audio calling
- **JWT** - Authentication tokens
- **bcrypt** - Password hashing
- **Validator.js** - Input validation

### Frontend (Planned)
- **React.js** - Frontend framework
- **Material-UI** - Component library
- **Axios** - HTTP client
- **React Router** - Navigation
- **Socket.io-client** - Real-time communication

## 📁 Project Structure

```
DevConnect/
├── backend/
│   ├── src/
│   │   ├── controllers/          # Business logic
│   │   │   ├── authController.js
│   │   │   ├── profileController.js
│   │   │   ├── requestController.js
│   │   │   ├── messageController.js
│   │   │   └── callController.js
│   │   ├── routes/               # Route definitions
│   │   │   ├── authRoutes.js
│   │   │   ├── profileRoutes.js
│   │   │   ├── requestRouter.js
│   │   │   ├── messageRoutes.js
│   │   │   └── callRoutes.js
│   │   ├── models/               # Database models
│   │   │   ├── userModel.js
│   │   │   ├── requestModel.js
│   │   │   ├── messageModel.js
│   │   │   └── callModel.js
│   │   ├── middlewares/          # Custom middlewares
│   │   │   └── authMiddleware.js
│   │   ├── config/               # Configuration files
│   │   │   ├── database.js
│   │   │   └── webrtc.js
│   │   ├── utils/                # Utility functions
│   │   │   └── validation.js
│   │   └── index.js              # Main server file
│   ├── package.json
│   └── apiList.md               # API documentation
├── frontend/
└── README.md
```

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User authentication
- `GET /api/auth/profile` - Get current user profile

### Profile Management
- `GET /api/profile/user/:userId` - Get user profile by ID
- `PATCH /api/profile/update` - Update current user profile
- `GET /api/profile/search` - Search users
- `GET /api/profile/suggestions` - Get suggested connections

### Connection Management
- `POST /api/request/send/:receiverId` - Send connection request
- `PATCH /api/request/accept/:requestId` - Accept connection request
- `PATCH /api/request/reject/:requestId` - Reject connection request
- `GET /api/request/pending` - Get pending requests
- `GET /api/request/sent` - Get sent requests
- `GET /api/request/connections` - Get all connections

### Messaging
- `POST /api/messages/send/:receiverId` - Send message
- `GET /api/messages/conversation/:userId` - Get conversation
- `GET /api/messages/conversations` - Get all conversations
- `PATCH /api/messages/read/:userId` - Mark messages as read
- `DELETE /api/messages/:messageId` - Delete message

### Video/Audio Calls
- `POST /api/calls/initiate/:receiverId` - Initiate call
- `PATCH /api/calls/accept/:callId` - Accept call
- `PATCH /api/calls/decline/:callId` - Decline call
- `PATCH /api/calls/end/:callId` - End call
- `GET /api/calls/history` - Get call history
- `GET /api/calls/:callId` - Get call details

### WebRTC Signaling
- `POST /api/calls/:callId/offer` - Store WebRTC offer
- `POST /api/calls/:callId/answer` - Store WebRTC answer
- `POST /api/calls/:callId/ice-candidate` - Store ICE candidate

## 🚀 Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- MongoDB
- npm or yarn

### Backend Setup
```bash
cd backend
npm install
npm start
```

### Environment Variables
Create a `.env` file in the backend directory:
```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/devconnect
JWT_SECRET=your_jwt_secret_key
```

## 💡 Key Implementation Highlights

### 1. Professional Connection System
- LinkedIn-style request/accept workflow
- Proper authorization and validation
- Status management (interested, accepted, rejected)

### 2. Real-time Messaging
- Socket.io powered instant messaging
- Typing indicators
- Message read status
- Conversation management

### 3. Video/Audio Calling
- WebRTC peer-to-peer calling
- Support for both audio and video calls
- STUN/TURN server configuration
- Call session management

### 4. Security Implementation
- JWT token-based authentication
- Password hashing with bcrypt
- Input validation and sanitization
- Protected routes with middleware

### 5. Clean Architecture
- Controller-based business logic separation
- Proper route organization
- Reusable middleware components
- Comprehensive error handling

## 🔗 Connection System Guide

### Request Status Types
```javascript
const REQUEST_STATUS = {
    INTERESTED: 'interested',  // Pending connection request
    ACCEPTED: 'accepted',      // Connection established
    REJECTED: 'rejected'       // Incoming request rejected
};
```

### Connection Flow
1. **Send Request**: User A sends connection request to User B
2. **Pending Status**: Request appears in User B's pending requests
3. **Accept/Reject**: User B can accept or reject the request
4. **Connection Established**: If accepted, both users become connected
5. **Messaging & Calls**: Connected users can message and call each other

## 📡 Real-time Features

### Socket.io Events
- **Messaging**: `send_message`, `new_message`, `typing`, `user_typing`
- **Video Calls**: `initiate_call`, `incoming_call`, `accept_call`, `decline_call`, `end_call`
- **WebRTC Signaling**: `webrtc_offer`, `webrtc_answer`, `ice_candidate`

### WebRTC Configuration
- STUN servers for basic connectivity
- TURN servers for NAT traversal
- Support for both audio and video calls
- Screen sharing capabilities

## 🔒 Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Input validation and sanitization
- Protected routes with middleware
- Connection-based access control
- Proper error handling without information leakage

## 📚 API Documentation

Complete API documentation is available in `backend/apiList.md` with:
- Detailed endpoint descriptions
- Request/response examples
- Error handling information
- Data model specifications
- Socket.io event documentation

## 🚧 Development Status

- ✅ Backend API complete
- ✅ Real-time messaging implemented
- ✅ Video/audio calling implemented
- ✅ Database models and relationships
- ✅ Authentication and authorization
- 🔄 Frontend development (planned)
- 🔄 Testing implementation (planned)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

# DevConnect Frontend

A comprehensive React-based frontend for the DevConnect social networking platform for developers.

## Features Implemented

### 🏠 **Dashboard**
- Welcome section with personalized greeting
- Statistics cards showing connections, requests, messages, and calls
- Recent connections and messages overview
- Profile overview with quick stats
- Growth metrics and activity tracking

### 📰 **Feed**
- Social feed with posts from connections
- Create new posts with rich text
- Like, comment, and share functionality
- Suggested connections sidebar
- Activity tracking and engagement metrics
- Real-time updates and interactions

### 👥 **Connections**
- View all current connections
- Manage pending connection requests
- Accept/reject incoming requests
- Discover and connect with suggested users
- Search and filter connections
- Connection profiles with skills and bio

### 💬 **Messages**
- Real-time messaging system
- Conversation list with recent messages
- Message search and filtering
- Typing indicators
- Message status (sent, delivered, read)
- File and image sharing support
- Voice message support

### 📞 **Calls**
- Video and audio calling
- Call history with detailed records
- Quick call contacts
- Call controls (mute, video toggle, end call)
- Call status tracking
- WebRTC integration for peer-to-peer calls

### 👤 **Profile**
- Comprehensive profile management
- Photo upload and editing
- Skills and bio management
- Location and website information
- Profile visibility settings
- Activity and statistics

## Tech Stack

- **React 18** - UI framework
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Styling
- **Zustand** - State management
- **React Router** - Navigation
- **Axios** - HTTP client
- **Lucide React** - Icons
- **React Hot Toast** - Notifications
- **Socket.IO** - Real-time communication

## Project Structure

```
src/
├── components/
│   ├── Auth/
│   │   ├── LoginForm.jsx
│   │   ├── RegisterForm.jsx
│   │   └── index.js
│   ├── Layout/
│   │   ├── Header.jsx
│   │   ├── Layout.jsx
│   │   ├── Sidebar.jsx
│   │   └── index.js
│   ├── UI/
│   │   ├── Avatar.jsx
│   │   ├── Button.jsx
│   │   ├── Card.jsx
│   │   ├── Input.jsx
│   │   └── index.js
│   └── index.js
├── pages/
│   ├── Dashboard.jsx
│   ├── Feed.jsx
│   ├── Profile.jsx
│   ├── Connections.jsx
│   ├── Messages.jsx
│   ├── Calls.jsx
│   └── index.js
├── utils/
│   ├── api.js
│   ├── store.js
│   ├── socket.js
│   └── cn.js
├── App.jsx
└── main.jsx
```

## State Management

The application uses Zustand for state management with the following stores:

### Auth Store
- User authentication state
- Token management
- Login/logout functionality
- User profile data

### UI Store
- Sidebar state
- Current chat selection
- Incoming/active calls
- Notifications

### Messages Store
- Conversations list
- Messages by conversation
- Typing indicators
- Message management

### Connections Store
- User connections
- Pending requests
- Sent requests
- Connection management

### Calls Store
- Call history
- Current call state
- Call management

## API Integration

The frontend integrates with all backend APIs:

### Authentication
- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `GET /auth/profile` - Get current user profile

### Profile Management
- `GET /profile/user/:userId` - Get user profile
- `PATCH /profile/update` - Update profile
- `GET /profile/search` - Search users
- `GET /profile/suggestions` - Get suggested connections

### Connections
- `POST /request/send/:receiverId` - Send connection request
- `PATCH /request/accept/:requestId` - Accept request
- `PATCH /request/reject/:requestId` - Reject request
- `GET /request/pending` - Get pending requests
- `GET /request/sent` - Get sent requests
- `GET /request/connections` - Get all connections

### Messaging
- `POST /messages/send/:receiverId` - Send message
- `GET /messages/conversation/:userId` - Get conversation
- `GET /messages/conversations` - Get all conversations
- `PATCH /messages/read/:userId` - Mark as read
- `DELETE /messages/:messageId` - Delete message

### Calls
- `POST /calls/initiate/:receiverId` - Initiate call
- `PATCH /calls/accept/:callId` - Accept call
- `PATCH /calls/decline/:callId` - Decline call
- `PATCH /calls/end/:callId` - End call
- `GET /calls/history` - Get call history
- `GET /calls/:callId` - Get call details

## Real-time Features

### Socket.IO Integration
- Real-time messaging
- Typing indicators
- Online/offline status
- Call notifications
- Message delivery status

### WebRTC for Calls
- Peer-to-peer video/audio calls
- Screen sharing support
- Call controls (mute, video toggle)
- Call recording (future feature)

## UI Components

### Reusable Components
- **Avatar** - User avatars with status indicators
- **Button** - Consistent button styling with variants
- **Card** - Content containers with headers
- **Input** - Form inputs with validation
- **Modal** - Overlay dialogs
- **Toast** - Notification system

### Layout Components
- **Header** - Top navigation bar
- **Sidebar** - Navigation menu
- **Layout** - Main layout wrapper
- **ProtectedRoute** - Authentication guard

## Styling

- **Tailwind CSS** for utility-first styling
- **Custom CSS** for specific components
- **Responsive design** for all screen sizes
- **Dark mode support** (future feature)
- **Accessibility** compliant

## Getting Started

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   Create a `.env` file:
   ```
   VITE_API_URL=http://localhost:3000/api
   VITE_SOCKET_URL=http://localhost:3000
   ```

3. **Start development server:**
   ```bash
   npm run dev
   ```

4. **Build for production:**
   ```bash
   npm run build
   ```

## Features by Page

### Dashboard
- ✅ Welcome section
- ✅ Statistics overview
- ✅ Recent activity
- ✅ Quick actions
- ✅ Profile summary

### Feed
- ✅ Social posts
- ✅ Create posts
- ✅ Like/comment/share
- ✅ Suggested connections
- ✅ Activity tracking

### Connections
- ✅ Connection management
- ✅ Request handling
- ✅ User discovery
- ✅ Search and filter
- ✅ Profile viewing

### Messages
- ✅ Real-time chat
- ✅ Conversation list
- ✅ Message history
- ✅ File sharing
- ✅ Typing indicators

### Calls
- ✅ Video/audio calls
- ✅ Call history
- ✅ Quick contacts
- ✅ Call controls
- ✅ WebRTC integration

### Profile
- ✅ Profile editing
- ✅ Photo upload
- ✅ Skills management
- ✅ Privacy settings
- ✅ Activity stats

## Future Enhancements

- [ ] Dark mode theme
- [ ] Advanced search filters
- [ ] Group messaging
- [ ] Call recording
- [ ] Screen sharing
- [ ] Push notifications
- [ ] Mobile app
- [ ] Advanced analytics
- [ ] Integration with GitHub/LinkedIn
- [ ] Job posting features

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License. 
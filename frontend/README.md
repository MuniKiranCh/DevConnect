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

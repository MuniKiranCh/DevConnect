# DevConnect - Professional Developer Networking Platform

A full-stack web application for developers to connect, network, and collaborate on projects. Built with modern technologies and following industry best practices.

## 🚀 Features

### Core Functionality
- **Professional Networking**: LinkedIn-style connection system for developers
- **User Authentication**: Secure JWT-based authentication system
- **Profile Management**: Comprehensive user profiles with skills and experience
- **Connection Requests**: Send, accept, reject, and decline professional connections
- **User Discovery**: Browse and discover other developers
- **Real-time Updates**: Live connection status updates

### Technical Features
- **RESTful API Design**: Clean, scalable API architecture
- **Database Integration**: MongoDB with Mongoose ODM
- **Security**: JWT authentication, password hashing, input validation
- **Error Handling**: Comprehensive error handling and validation
- **Middleware Implementation**: Custom authentication and validation middleware

## 🛠️ Tech Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - NoSQL database
- **Mongoose** - Object Data Modeling
- **JWT** - Authentication tokens
- **bcrypt** - Password hashing
- **Validator.js** - Input validation

### Frontend (Planned)
- **React.js** - Frontend framework
- **Material-UI** - Component library
- **Axios** - HTTP client
- **React Router** - Navigation

## 📁 Project Structure

```
DevConnect/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── database.js
│   │   ├── middlewares/
│   │   │   └── authMiddleware.js
│   │   ├── models/
│   │   │   ├── userModel.js
│   │   │   └── requestModel.js
│   │   ├── routes/
│   │   │   ├── authRoutes.js
│   │   │   ├── profileRoutes.js
│   │   │   └── requestRouter.js
│   │   ├── utils/
│   │   │   └── validation.js
│   │   └── index.js
│   ├── package.json
│   └── apiList.md
├── frontend/
└── README.md
```

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/signup` - User registration
- `POST /api/auth/login` - User authentication
- `POST /api/auth/logout` - User logout

### Profile Management
- `GET /api/profile/view` - Get user profile
- `PATCH /api/profile/edit` - Update user profile
- `PATCH /api/profile/password` - Change password
- `GET /api/profile/feed` - Get user discovery feed

### Connection Management
- `POST /api/request/send/interested/:userId` - Send connection request
- `POST /api/request/send/declined/:userId` - Decline connection request
- `POST /api/request/review/accepted/:requestId` - Accept incoming request
- `POST /api/request/review/rejected/:requestId` - Reject incoming request

### Connection Status
- `GET /api/request/matches` - Get all accepted connections
- `GET /api/request/interested-requests` - Get pending requests
- `GET /api/request/interactions` - Get all interactions

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
- Status management (interested, declined, accepted, rejected)

### 2. Security Implementation
- JWT token-based authentication
- Password hashing with bcrypt
- Input validation and sanitization
- Protected routes with middleware

### 3. Database Design
- Normalized user and request models
- Proper indexing and relationships
- Timestamp tracking for all interactions

### 4. Error Handling
- Comprehensive error responses
- Input validation with detailed messages
- Graceful error recovery

## 🔗 **Complete Connection System Guide**

### **📊 Request Status Types**
```javascript
const REQUEST_STATUS = {
    INTERESTED: 'interested',  // Pending connection request
    DECLINED: 'declined',      // User declined to connect
    ACCEPTED: 'accepted',      // Connection established
    REJECTED: 'rejected'       // Incoming request rejected
};
```

### **🔄 How Connection Requests Work**

#### **Scenario 1: Normal Connection Flow (Accept)**
```
1. User A sees User B in feed
2. User A clicks "Connect" → POST /api/request/send/interested/:userId
   → Creates: { sender: "UserA", receiver: "UserB", status: "interested" }
3. User B sees pending request → GET /api/request/interested-requests
4. User B accepts → POST /api/request/review/accepted/:requestId
   → Updates: { status: "accepted" }
5. Both users are now connected → GET /api/request/matches
```

#### **Scenario 2: Normal Connection Flow (Reject)**
```
1. User A sees User B in feed
2. User A clicks "Connect" → POST /api/request/send/interested/:userId
   → Creates: { sender: "UserA", receiver: "UserB", status: "interested" }
3. User B sees pending request → GET /api/request/interested-requests
4. User B rejects → POST /api/request/review/rejected/:requestId
   → Updates: { status: "rejected" }
5. No connection established
```

#### **Scenario 3: User Declines Initially**
```
1. User A sees User B in feed
2. User A clicks "Decline" → POST /api/request/send/declined/:userId
   → Creates: { sender: "UserA", receiver: "UserB", status: "declined" }
3. User B never sees any request (no notification)
4. User A cannot send request later → Error: "Connection request already processed"
```

#### **Scenario 4: User Changes Mind**
```
1. User A sends request → status: "interested"
2. User B sees pending request
3. User A changes mind → POST /api/request/send/declined/:userId
   → Updates: { status: "interested" → "declined" }
4. User B no longer sees pending request
5. User A cannot send request again → Error: "Connection request already processed"
```

### **🛡️ Business Rules & Validations**

#### **1. Duplicate Prevention**
- **Cannot send multiple requests** to the same user
- **Cannot decline the same user** multiple times
- **Cannot send requests** if already connected, rejected, or declined

#### **2. Authorization Control**
- **Only receiver can accept/reject** incoming requests
- **Only sender can decline** their own requests
- **Cannot interact with yourself**

#### **3. Status Transitions**
```
No interaction → "interested" (send request)
No interaction → "declined" (decline user)
"interested" → "accepted" (receiver accepts)
"interested" → "rejected" (receiver rejects)
"interested" → "declined" (sender changes mind)
```

### **🎯 Key Features Explained**

#### **1. Professional Networking**
- **LinkedIn-style workflow** - one-way requests with manual review
- **No mutual matching** - unlike Tinder, no automatic matching
- **Professional terminology** - connections, not matches

#### **2. Status Tracking**
- **Complete visibility** - users can see all status changes
- **Transparent communication** - clear feedback on all actions
- **Data consistency** - prevents invalid states

#### **3. User Experience**
- **Change of mind support** - can withdraw requests before acceptance
- **Final decisions** - declined users cannot be re-requested
- **Clean interface** - no spam or duplicate requests

#### **4. Technical Implementation**
- **JWT authentication** - secure user sessions
- **MongoDB relationships** - proper data modeling
- **RESTful API** - standard HTTP methods
- **Error handling** - comprehensive validation and feedback

## 🎯 Learning Outcomes

This project demonstrates proficiency in:
- **Full-Stack Development**: Complete web application architecture
- **API Design**: RESTful API development with proper HTTP methods
- **Database Management**: MongoDB schema design and optimization
- **Authentication & Security**: JWT implementation and security best practices
- **Code Organization**: Modular architecture with separation of concerns
- **Error Handling**: Robust error management and validation
- **Documentation**: Comprehensive API documentation

## 🔮 Future Enhancements

- Real-time messaging system
- Project collaboration features
- Skill-based matching algorithm
- Mobile application
- Advanced search and filtering
- Notification system

## 📝 License

This project is created for educational and portfolio purposes.

---

**Built with ❤️ for professional developer networking** 
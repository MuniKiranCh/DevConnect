# DevConnect APIs - Professional Developer Networking Platform

## Authentication APIs
- POST /api/auth/signup - User registration
- POST /api/auth/login - User authentication
- POST /api/auth/logout - User logout

## Profile Management APIs
- GET /api/profile/view - Get user profile
- PATCH /api/profile/edit - Update user profile
- POST /api/profile/password/change - Change password (auth required)
- POST /api/profile/password/reset/request - Request password reset (no auth)
- POST /api/profile/password/reset/reset - Reset password with token (no auth)
- GET /api/profile/feed - Get user discovery feed
- DELETE /api/profile/delete - Delete user account

## Connection Management APIs
- POST /api/request/send/interested/:userId - Send connection request
- POST /api/request/send/declined/:userId - Decline connection request
- POST /api/request/review/accepted/:requestId - Accept incoming connection request
- POST /api/request/review/rejected/:requestId - Reject incoming connection request

## Connection Status APIs
- GET /api/request/matches - Get all accepted connections
- GET /api/request/interested-requests - Get pending connection requests
- GET /api/request/interactions - Get all connection interactions

## Request Status Types
- **interested** - Pending connection request (waiting for response)
- **accepted** - Connection established (both users connected)
- **rejected** - Incoming request was rejected by receiver
- **declined** - User actively declined to connect with someone

## Features Implemented:
- ✅ JWT Authentication & Authorization
- ✅ User Profile Management
- ✅ Professional Connection System
- ✅ Password Reset Functionality
- ✅ Request Validation & Error Handling
- ✅ MongoDB Database Integration
- ✅ RESTful API Design
- ✅ Middleware Implementation
- ✅ Data Validation & Sanitization

### **📱 API Usage Examples**

#### **Send Connection Request**
```bash
POST /api/request/send/interested/64a1b2c3d4e5f6789012345
Authorization: Bearer <JWT_TOKEN>

Response:
{
    "message": "Connection request sent successfully",
    "requestId": "64a1b2c3d4e5f6789012346"
}
```

#### **View Pending Requests**
```bash
GET /api/request/interested-requests
Authorization: Bearer <JWT_TOKEN>

Response:
{
    "interestedRequests": [
        {
            "_id": "64a1b2c3d4e5f6789012346",
            "sender": {
                "_id": "64a1b2c3d4e5f6789012345",
                "name": "John Doe",
                "profile_pic": "https://..."
            },
            "status": "interested",
            "createdAt": "2024-01-15T10:30:00Z"
        }
    ]
}
```

#### **Accept Connection Request**
```bash
POST /api/request/review/accepted/64a1b2c3d4e5f6789012346
Authorization: Bearer <JWT_TOKEN>

Response:
{
    "message": "Request accepted successfully"
}
```

#### **View Connections**
```bash
GET /api/request/matches
Authorization: Bearer <JWT_TOKEN>

Response:
{
    "matches": [
        {
            "_id": "64a1b2c3d4e5f6789012346",
            "sender": {
                "_id": "64a1b2c3d4e5f6789012345",
                "name": "John Doe",
                "profile_pic": "https://..."
            },
            "receiver": {
                "_id": "64a1b2c3d4e5f6789012347",
                "name": "Sarah Smith",
                "profile_pic": "https://..."
            },
            "status": "accepted",
            "createdAt": "2024-01-15T10:30:00Z"
        }
    ]
}
```

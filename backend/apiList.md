# DevConnect Backend API Documentation

## Base URL
```
http://localhost:3000/api
```

## Authentication Endpoints

### POST /auth/register
Register a new user
- **Body:**
  ```json
  {
    "username": "string",
    "email": "string",
    "password": "string",
    "firstName": "string",
    "lastName": "string",
    "bio": "string (optional)",
    "skills": ["string"],
    "location": "string (optional)",
    "website": "string (optional)"
  }
  ```
- **Response:** User object with token

### POST /auth/login
Login user
- **Body:**
  ```json
  {
    "email": "string",
    "password": "string"
  }
  ```
- **Response:** User object with token

### GET /auth/profile
Get current user profile (Protected)
- **Headers:** Authorization: Bearer <token>
- **Response:** User profile object

## Profile Endpoints

### GET /profile/user/:userId
Get user profile by ID (Protected)
- **Headers:** Authorization: Bearer <token>
- **Params:** userId (MongoDB ObjectId)
- **Response:** User profile object

### PATCH /profile/update
Update current user profile (Protected)
- **Headers:** Authorization: Bearer <token>
- **Body:**
  ```json
  {
    "firstName": "string (optional)",
    "lastName": "string (optional)",
    "bio": "string (optional)",
    "skills": ["string"] (optional),
    "location": "string (optional)",
    "website": "string (optional)",
    "avatar": "string (optional)"
  }
  ```
- **Response:** Updated user profile

### GET /profile/search
Search users (Protected)
- **Headers:** Authorization: Bearer <token>
- **Query Parameters:**
  - `q`: Search query (string)
  - `skills`: Skills filter (string, comma-separated)
  - `location`: Location filter (string)
  - `page`: Page number (number, default: 1)
  - `limit`: Results per page (number, default: 10)
- **Response:** Array of user profiles

### GET /profile/suggestions
Get suggested connections (Protected)
- **Headers:** Authorization: Bearer <token>
- **Query Parameters:**
  - `limit`: Number of suggestions (number, default: 10)
- **Response:** Array of suggested user profiles

## Connection Request Endpoints

### POST /request/send/:receiverId
Send connection request (Protected)
- **Headers:** Authorization: Bearer <token>
- **Params:** receiverId (MongoDB ObjectId)
- **Response:** Request object

### PATCH /request/accept/:requestId
Accept connection request (Protected)
- **Headers:** Authorization: Bearer <token>
- **Params:** requestId (MongoDB ObjectId)
- **Response:** Updated request object

### PATCH /request/reject/:requestId
Reject connection request (Protected)
- **Headers:** Authorization: Bearer <token>
- **Params:** requestId (MongoDB ObjectId)
- **Response:** Updated request object

### GET /request/pending
Get pending requests (Protected)
- **Headers:** Authorization: Bearer <token>
- **Response:** Array of pending requests

### GET /request/sent
Get sent requests (Protected)
- **Headers:** Authorization: Bearer <token>
- **Response:** Array of sent requests

### GET /request/connections
Get all connections (Protected)
- **Headers:** Authorization: Bearer <token>
- **Response:** Array of connected users

## Messaging Endpoints

### POST /messages/send/:receiverId
Send message to connected user (Protected)
- **Headers:** Authorization: Bearer <token>
- **Params:** receiverId (MongoDB ObjectId)
- **Body:**
  ```json
  {
    "content": "string",
    "type": "text" | "image" | "file" (optional, default: "text")
  }
  ```
- **Response:** Message object

### GET /messages/conversation/:userId
Get conversation with specific user (Protected)
- **Headers:** Authorization: Bearer <token>
- **Params:** userId (MongoDB ObjectId)
- **Query Parameters:**
  - `page`: Page number (number, default: 1)
  - `limit`: Messages per page (number, default: 50)
- **Response:** Array of messages

### GET /messages/conversations
Get all conversations (Protected)
- **Headers:** Authorization: Bearer <token>
- **Response:** Array of conversation summaries

### PATCH /messages/read/:userId
Mark messages as read (Protected)
- **Headers:** Authorization: Bearer <token>
- **Params:** userId (MongoDB ObjectId)
- **Response:** Success message

### DELETE /messages/:messageId
Delete a message (Protected)
- **Headers:** Authorization: Bearer <token>
- **Params:** messageId (MongoDB ObjectId)
- **Response:** Success message

## Call Endpoints

### POST /calls/initiate/:receiverId
Initiate a call (Protected)
- **Headers:** Authorization: Bearer <token>
- **Params:** receiverId (MongoDB ObjectId)
- **Body:**
  ```json
  {
    "callType": "video" | "audio" (optional, default: "video")
  }
  ```
- **Response:** Call object

### PATCH /calls/accept/:callId
Accept a call (Protected)
- **Headers:** Authorization: Bearer <token>
- **Params:** callId (MongoDB ObjectId)
- **Response:** Updated call object

### PATCH /calls/decline/:callId
Decline a call (Protected)
- **Headers:** Authorization: Bearer <token>
- **Params:** callId (MongoDB ObjectId)
- **Response:** Updated call object

### PATCH /calls/end/:callId
End a call (Protected)
- **Headers:** Authorization: Bearer <token>
- **Params:** callId (MongoDB ObjectId)
- **Response:** Updated call object

### GET /calls/history
Get call history (Protected)
- **Headers:** Authorization: Bearer <token>
- **Query Parameters:**
  - `page`: Page number (number, default: 1)
  - `limit`: Calls per page (number, default: 20)
- **Response:** Array of call records

### GET /calls/:callId
Get call details (Protected)
- **Headers:** Authorization: Bearer <token>
- **Params:** callId (MongoDB ObjectId)
- **Response:** Call object

### POST /calls/:callId/offer
Store WebRTC offer (Protected)
- **Headers:** Authorization: Bearer <token>
- **Params:** callId (MongoDB ObjectId)
- **Body:**
  ```json
  {
    "offer": "string (SDP offer)"
  }
  ```
- **Response:** Success message

### POST /calls/:callId/answer
Store WebRTC answer (Protected)
- **Headers:** Authorization: Bearer <token>
- **Params:** callId (MongoDB ObjectId)
- **Body:**
  ```json
  {
    "answer": "string (SDP answer)"
  }
  ```
- **Response:** Success message

### POST /calls/:callId/ice-candidate
Store ICE candidate (Protected)
- **Headers:** Authorization: Bearer <token>
- **Params:** callId (MongoDB ObjectId)
- **Body:**
  ```json
  {
    "candidate": "string (ICE candidate)"
  }
  ```
- **Response:** Success message

## Socket.IO Events

### Client to Server Events:
- `join`: Join with userId
- `send_message`: Send message to user
- `typing`: Send typing indicator
- `initiate_call`: Initiate video/audio call
- `accept_call`: Accept incoming call
- `decline_call`: Decline incoming call
- `end_call`: End active call
- `webrtc_offer`: Send WebRTC offer
- `webrtc_answer`: Send WebRTC answer
- `ice_candidate`: Send ICE candidate

### Server to Client Events:
- `new_message`: Receive new message
- `user_typing`: Receive typing indicator
- `incoming_call`: Receive incoming call
- `call_accepted`: Call accepted notification
- `call_declined`: Call declined notification
- `call_ended`: Call ended notification
- `webrtc_offer`: Receive WebRTC offer
- `webrtc_answer`: Receive WebRTC answer
- `ice_candidate`: Receive ICE candidate

## Error Responses

All endpoints may return the following error responses:

### 400 Bad Request
```json
{
  "error": "Validation error message"
}
```

### 401 Unauthorized
```json
{
  "error": "Authentication required"
}
```

### 403 Forbidden
```json
{
  "error": "Access denied"
}
```

### 404 Not Found
```json
{
  "error": "Resource not found"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error"
}
```

## Authentication

Most endpoints require authentication using JWT tokens. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## Environment Variables

Create a `.env` file in the backend directory with:

```
PORT=3000
MONGODB_URI=mongodb://localhost:27017/devconnect
JWT_SECRET=your-secret-key
JWT_EXPIRE=7d
``` 
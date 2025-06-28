# DevConnect Backend - Postman Testing Guide

## Setup Instructions

### 1. Environment Setup
Create a new environment in Postman with these variables:
- `base_url`: `http://localhost:3000/api`
- `token`: (will be set after login)

### 2. Collection Setup
Create a new collection called "DevConnect API" and organize requests by folders:
- Authentication
- Profile
- Connection Requests
- Messaging
- Calls

## Authentication Testing

### 1. Register User
**Method:** POST  
**URL:** `{{base_url}}/auth/register`  
**Headers:** Content-Type: application/json  
**Body (raw JSON):**
```json
{
  "username": "testuser",
  "email": "test@example.com",
  "password": "password123",
  "firstName": "Test",
  "lastName": "User",
  "bio": "Software Developer",
  "skills": ["JavaScript", "Node.js", "React"],
  "location": "New York",
  "website": "https://testuser.com"
}
```

### 2. Login User
**Method:** POST  
**URL:** `{{base_url}}/auth/login`  
**Headers:** Content-Type: application/json  
**Body (raw JSON):**
```json
{
  "email": "test@example.com",
  "password": "password123"
}
```

**Script to auto-set token:**
```javascript
if (pm.response.code === 200) {
    const response = pm.response.json();
    pm.environment.set("token", response.token);
}
```

### 3. Get Profile
**Method:** GET  
**URL:** `{{base_url}}/auth/profile`  
**Headers:** 
- Authorization: Bearer {{token}}

## Profile Testing

### 1. Get User Profile by ID
**Method:** GET  
**URL:** `{{base_url}}/profile/user/{{userId}}`  
**Headers:** Authorization: Bearer {{token}}

### 2. Update Profile
**Method:** PATCH  
**URL:** `{{base_url}}/profile/update`  
**Headers:** 
- Authorization: Bearer {{token}}
- Content-Type: application/json  
**Body (raw JSON):**
```json
{
  "firstName": "Updated",
  "lastName": "Name",
  "bio": "Updated bio",
  "skills": ["JavaScript", "Node.js", "React", "MongoDB"],
  "location": "San Francisco",
  "website": "https://updated.com"
}
```

### 3. Search Users
**Method:** GET  
**URL:** `{{base_url}}/profile/search?q=developer&skills=JavaScript&location=New York&page=1&limit=10`  
**Headers:** Authorization: Bearer {{token}}

### 4. Get Suggested Connections
**Method:** GET  
**URL:** `{{base_url}}/profile/suggestions?limit=5`  
**Headers:** Authorization: Bearer {{token}}

## Connection Request Testing

### 1. Send Connection Request
**Method:** POST  
**URL:** `{{base_url}}/request/send/{{receiverId}}`  
**Headers:** Authorization: Bearer {{token}}

### 2. Get Pending Requests
**Method:** GET  
**URL:** `{{base_url}}/request/pending`  
**Headers:** Authorization: Bearer {{token}}

### 3. Accept Connection Request
**Method:** PATCH  
**URL:** `{{base_url}}/request/accept/{{requestId}}`  
**Headers:** Authorization: Bearer {{token}}

### 4. Reject Connection Request
**Method:** PATCH  
**URL:** `{{base_url}}/request/reject/{{requestId}}`  
**Headers:** Authorization: Bearer {{token}}

### 5. Get Sent Requests
**Method:** GET  
**URL:** `{{base_url}}/request/sent`  
**Headers:** Authorization: Bearer {{token}}

### 6. Get Connections
**Method:** GET  
**URL:** `{{base_url}}/request/connections`  
**Headers:** Authorization: Bearer {{token}}

## Messaging Testing

### 1. Send Message
**Method:** POST  
**URL:** `{{base_url}}/messages/send/{{receiverId}}`  
**Headers:** 
- Authorization: Bearer {{token}}
- Content-Type: application/json  
**Body (raw JSON):**
```json
{
  "content": "Hello! How are you?",
  "type": "text"
}
```

### 2. Get Conversation
**Method:** GET  
**URL:** `{{base_url}}/messages/conversation/{{userId}}?page=1&limit=50`  
**Headers:** Authorization: Bearer {{token}}

### 3. Get All Conversations
**Method:** GET  
**URL:** `{{base_url}}/messages/conversations`  
**Headers:** Authorization: Bearer {{token}}

### 4. Mark Messages as Read
**Method:** PATCH  
**URL:** `{{base_url}}/messages/read/{{userId}}`  
**Headers:** Authorization: Bearer {{token}}

### 5. Delete Message
**Method:** DELETE  
**URL:** `{{base_url}}/messages/{{messageId}}`  
**Headers:** Authorization: Bearer {{token}}

## Call Testing

### 1. Initiate Call
**Method:** POST  
**URL:** `{{base_url}}/calls/initiate/{{receiverId}}`  
**Headers:** 
- Authorization: Bearer {{token}}
- Content-Type: application/json  
**Body (raw JSON):**
```json
{
  "callType": "video"
}
```

### 2. Accept Call
**Method:** PATCH  
**URL:** `{{base_url}}/calls/accept/{{callId}}`  
**Headers:** Authorization: Bearer {{token}}

### 3. Decline Call
**Method:** PATCH  
**URL:** `{{base_url}}/calls/decline/{{callId}}`  
**Headers:** Authorization: Bearer {{token}}

### 4. End Call
**Method:** PATCH  
**URL:** `{{base_url}}/calls/end/{{callId}}`  
**Headers:** Authorization: Bearer {{token}}

### 5. Get Call History
**Method:** GET  
**URL:** `{{base_url}}/calls/history?page=1&limit=20`  
**Headers:** Authorization: Bearer {{token}}

### 6. Get Call Details
**Method:** GET  
**URL:** `{{base_url}}/calls/{{callId}}`  
**Headers:** Authorization: Bearer {{token}}

### 7. Store WebRTC Offer
**Method:** POST  
**URL:** `{{base_url}}/calls/{{callId}}/offer`  
**Headers:** 
- Authorization: Bearer {{token}}
- Content-Type: application/json  
**Body (raw JSON):**
```json
{
  "offer": "v=0\r\no=- 1234567890 2 IN IP4 127.0.0.1\r\ns=-\r\nt=0 0\r\na=group:BUNDLE 0\r\n..."
}
```

### 8. Store WebRTC Answer
**Method:** POST  
**URL:** `{{base_url}}/calls/{{callId}}/answer`  
**Headers:** 
- Authorization: Bearer {{token}}
- Content-Type: application/json  
**Body (raw JSON):**
```json
{
  "answer": "v=0\r\no=- 1234567890 2 IN IP4 127.0.0.1\r\ns=-\r\nt=0 0\r\na=group:BUNDLE 0\r\n..."
}
```

### 9. Store ICE Candidate
**Method:** POST  
**URL:** `{{base_url}}/calls/{{callId}}/ice-candidate`  
**Headers:** 
- Authorization: Bearer {{token}}
- Content-Type: application/json  
**Body (raw JSON):**
```json
{
  "candidate": "candidate:1 1 UDP 2122252543 192.168.1.1 12345 typ host"
}
```

## Testing Workflow

### Step 1: Setup Users
1. Register User 1
2. Register User 2
3. Login with both users and save tokens

### Step 2: Test Connection Flow
1. User 1 sends connection request to User 2
2. User 2 accepts the request
3. Verify both users are now connected

### Step 3: Test Messaging
1. User 1 sends message to User 2
2. User 2 retrieves conversation
3. User 2 marks messages as read
4. User 2 sends reply message

### Step 4: Test Calls
1. User 1 initiates call to User 2
2. User 2 accepts call
3. Test WebRTC signaling (offer/answer/ICE candidates)
4. End call
5. Check call history

## Environment Variables to Set

After successful API calls, set these variables in your Postman environment:
- `userId`: ID of the user you're testing with
- `receiverId`: ID of another user for testing connections/messages/calls
- `requestId`: ID from connection request response
- `messageId`: ID from message response
- `callId`: ID from call response

## Common Test Scripts

### Test Response Status
```javascript
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});
```

### Test Response Structure
```javascript
pm.test("Response has required fields", function () {
    const response = pm.response.json();
    pm.expect(response).to.have.property('success');
    pm.expect(response).to.have.property('data');
});
```

### Auto-extract IDs
```javascript
if (pm.response.code === 200) {
    const response = pm.response.json();
    if (response.data && response.data._id) {
        pm.environment.set("userId", response.data._id);
    }
}
```

## Socket.IO Testing

For real-time features, use a WebSocket client or browser console:

```javascript
// Connect to Socket.IO
const socket = io('http://localhost:3000');

// Join with user ID
socket.emit('join', 'userId');

// Send message
socket.emit('send_message', {
    receiverId: 'receiverId',
    message: 'Hello from Socket.IO!'
});

// Listen for new messages
socket.on('new_message', (data) => {
    console.log('New message:', data);
});

// Initiate call
socket.emit('initiate_call', {
    receiverId: 'receiverId',
    callType: 'video'
});

// Listen for incoming calls
socket.on('incoming_call', (data) => {
    console.log('Incoming call:', data);
});
```

## Troubleshooting

### Common Issues:
1. **401 Unauthorized**: Check if token is valid and properly set
2. **404 Not Found**: Verify URL and route parameters
3. **400 Bad Request**: Check request body format and required fields
4. **500 Internal Server Error**: Check server logs and database connection

### Debug Tips:
1. Use console.log in your Node.js server to debug
2. Check MongoDB connection
3. Verify JWT_SECRET is set in environment
4. Test with simple requests first before complex ones 
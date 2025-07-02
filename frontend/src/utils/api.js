import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000/api';
// import.meta.env.VITE_API_URL || 

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (userData) => api.post('/auth/register', userData),
  login: (credentials) => api.post('/auth/login', credentials),
  getProfile: () => api.get('/auth/profile'),
};

// Profile API
export const profileAPI = {
  getUserProfile: (userId) => api.get(`/profile/user/${userId}`),
  updateProfile: (profileData) => api.patch('/profile/update', profileData),
  searchUsers: (params) => api.get('/profile/search', { params }),
  getSuggestions: (params) => api.get('/profile/suggestions', { params }),
};

// Connection API
export const connectionAPI = {
  sendRequest: (receiverId) => api.post(`/request/send/${receiverId}`),
  acceptRequest: (requestId) => api.patch(`/request/accept/${requestId}`),
  rejectRequest: (requestId) => api.patch(`/request/reject/${requestId}`),
  getPendingRequests: () => api.get('/request/pending'),
  getSentRequests: () => api.get('/request/sent'),
  getConnections: () => api.get('/request/connections'),
};

// Messaging API
export const messageAPI = {
  sendMessage: (receiverId, messageData) => 
    api.post(`/messages/send/${receiverId}`, messageData),
  getConversation: (userId, params) => 
    api.get(`/messages/conversation/${userId}`, { params }),
  getConversations: () => api.get('/messages/conversations'),
  markAsRead: (userId) => api.patch(`/messages/read/${userId}`),
  deleteMessage: (messageId) => api.delete(`/messages/${messageId}`),
};

// Call API
export const callAPI = {
  initiateCall: (receiverId, callData) => 
    api.post(`/calls/initiate/${receiverId}`, callData),
  acceptCall: (callId) => api.patch(`/calls/accept/${callId}`),
  declineCall: (callId) => api.patch(`/calls/decline/${callId}`),
  endCall: (callId) => api.patch(`/calls/end/${callId}`),
  getCallHistory: (params) => api.get('/calls/history', { params }),
  getCallDetails: (callId) => api.get(`/calls/${callId}`),
  storeOffer: (callId, offer) => api.post(`/calls/${callId}/offer`, { offer }),
  storeAnswer: (callId, answer) => api.post(`/calls/${callId}/answer`, { answer }),
  storeIceCandidate: (callId, candidate) => 
    api.post(`/calls/${callId}/ice-candidate`, { candidate }),
};

export default api; 
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Auth Store
export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      
      login: (userData, token) => {
        set({
          user: userData,
          token,
          isAuthenticated: true,
        });
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(userData));
      },
      
      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        });
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      },
      
      updateUser: (userData) => {
        set({ user: userData });
        localStorage.setItem('user', JSON.stringify(userData));
      },
      
      initialize: () => {
        const token = localStorage.getItem('token');
        const user = localStorage.getItem('user');
        
        if (token && user) {
          set({
            user: JSON.parse(user),
            token,
            isAuthenticated: true,
          });
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user, token: state.token }),
    }
  )
);

// UI Store
export const useUIStore = create((set) => ({
  sidebarOpen: false,
  currentChat: null,
  incomingCall: null,
  activeCall: null,
  notifications: [],
  
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  
  setCurrentChat: (chat) => set({ currentChat: chat }),
  
  setIncomingCall: (call) => set({ incomingCall: call }),
  
  setActiveCall: (call) => set({ activeCall: call }),
  
  addNotification: (notification) => 
    set((state) => ({ 
      notifications: [...state.notifications, { ...notification, id: Date.now() }] 
    })),
  
  removeNotification: (id) => 
    set((state) => ({ 
      notifications: state.notifications.filter(n => n.id !== id) 
    })),
  
  clearNotifications: () => set({ notifications: [] }),
}));

// Messages Store
export const useMessagesStore = create((set, get) => ({
  conversations: [],
  messages: {},
  typingUsers: {},
  
  setConversations: (conversations) => set({ conversations }),
  
  addConversation: (conversation) => 
    set((state) => ({ 
      conversations: [conversation, ...state.conversations.filter(c => c._id !== conversation._id)] 
    })),
  
  setMessages: (userId, messages) => 
    set((state) => ({ 
      messages: { ...state.messages, [userId]: messages } 
    })),
  
  addMessage: (userId, message) => 
    set((state) => ({ 
      messages: { 
        ...state.messages, 
        [userId]: [...(state.messages[userId] || []), message] 
      } 
    })),
  
  updateMessage: (userId, messageId, updates) => 
    set((state) => ({ 
      messages: { 
        ...state.messages, 
        [userId]: (state.messages[userId] || []).map(m => 
          m._id === messageId ? { ...m, ...updates } : m
        ) 
      } 
    })),
  
  deleteMessage: (userId, messageId) => 
    set((state) => ({ 
      messages: { 
        ...state.messages, 
        [userId]: (state.messages[userId] || []).filter(m => m._id !== messageId) 
      } 
    })),
  
  setTypingUser: (userId, isTyping) => 
    set((state) => ({ 
      typingUsers: { ...state.typingUsers, [userId]: isTyping } 
    })),
  
  removeTypingUser: (userId) => 
    set((state) => ({ 
      typingUsers: { ...state.typingUsers, [userId]: false } 
    })),
}));

// Connections Store
export const useConnectionsStore = create((set) => ({
  connections: [],
  pendingRequests: [],
  sentRequests: [],
  
  setConnections: (connections) => set({ connections }),
  
  addConnection: (connection) => 
    set((state) => ({ 
      connections: [...state.connections, connection] 
    })),
  
  removeConnection: (connectionId) => 
    set((state) => ({ 
      connections: state.connections.filter(c => c._id !== connectionId) 
    })),
  
  setPendingRequests: (requests) => set({ pendingRequests: requests }),
  
  addPendingRequest: (request) => 
    set((state) => ({ 
      pendingRequests: [...state.pendingRequests, request] 
    })),
  
  removePendingRequest: (requestId) => 
    set((state) => ({ 
      pendingRequests: state.pendingRequests.filter(r => r._id !== requestId) 
    })),
  
  setSentRequests: (requests) => set({ sentRequests: requests }),
  
  addSentRequest: (request) => 
    set((state) => ({ 
      sentRequests: [...state.sentRequests, request] 
    })),
  
  removeSentRequest: (requestId) => 
    set((state) => ({ 
      sentRequests: state.sentRequests.filter(r => r._id !== requestId) 
    })),
}));

// Calls Store
export const useCallsStore = create((set) => ({
  callHistory: [],
  currentCall: null,
  
  setCallHistory: (history) => set({ callHistory: history }),
  
  addCallToHistory: (call) => 
    set((state) => ({ 
      callHistory: [call, ...state.callHistory] 
    })),
  
  setCurrentCall: (call) => set({ currentCall: call }),
  
  endCurrentCall: () => set({ currentCall: null }),
}));

// Users Store
export const useUsersStore = create((set) => ({
  users: [],
  suggestions: [],
  searchResults: [],
  
  setUsers: (users) => set({ users }),
  
  addUser: (user) => 
    set((state) => ({ 
      users: [...state.users, user] 
    })),
  
  updateUser: (userId, updates) => 
    set((state) => ({ 
      users: state.users.map(u => u._id === userId ? { ...u, ...updates } : u) 
    })),
  
  setSuggestions: (suggestions) => set({ suggestions }),
  
  setSearchResults: (results) => set({ searchResults: results }),
  
  clearSearchResults: () => set({ searchResults: [] }),
})); 
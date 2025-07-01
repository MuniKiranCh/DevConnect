import React, { useEffect, useState, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuthStore, useConnectionsStore } from './utils/store';
import { LoginForm, RegisterForm } from './components/Auth';
import { Layout } from './components/Layout';
import { Dashboard, Profile, Connections, Messages, Calls, Feed } from './pages';
import './index.css';
import io from 'socket.io-client';

const RINGTONE_URL = 'https://actions.google.com/sounds/v1/alarms/alarm_clock.ogg';
const socket = io('http://192.168.155.234:3000'); // Adjust if backend URL changes

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, initialize } = useAuthStore();
  
  useEffect(() => {
    initialize();
  }, [initialize]);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// Public Route Component (redirects to dashboard if already authenticated)
const PublicRoute = ({ children }) => {
  const { isAuthenticated, initialize } = useAuthStore();
  
  useEffect(() => {
    initialize();
  }, [initialize]);

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// Main App Component with Navigation
function AppContent() {
  const { user } = useAuthStore();
  const { connections } = useConnectionsStore();
  const [incomingCall, setIncomingCall] = useState(null);
  const [isRinging, setIsRinging] = useState(false);
  const ringtoneRef = useRef(null);
  const navigate = useNavigate();

  // Request notification permissions on app load
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Join socket and listen for incoming calls globally
  useEffect(() => {
    if (user?._id) {
      // Ensure socket is connected before joining
      if (socket.connected) {
        socket.emit('join', user._id);
        console.log(`User ${user._id} joined socket room globally`);
      } else {
        socket.on('connect', () => {
          socket.emit('join', user._id);
          console.log(`User ${user._id} joined socket room after connection`);
        });
      }
    }

    // Handle incoming calls
    socket.on('incoming_call', (data) => {
      // Ignore if the current user is the caller
      if (data.callerId === user?._id) return;
      console.log('Received incoming call:', data);
      setIncomingCall(data);
      setIsRinging(true);
      
      // Play ringtone with error handling
      if (ringtoneRef.current) {
        ringtoneRef.current.muted = false;
        ringtoneRef.current.volume = 0.7;
        ringtoneRef.current.play().catch(error => {
          console.error('Error playing ringtone:', error);
          // Fallback: try to play without user interaction
          ringtoneRef.current.muted = false;
          ringtoneRef.current.play().catch(e => console.error('Fallback ringtone failed:', e));
        });
      }
      
      // Vibrate on mobile devices (if supported)
      if ('vibrate' in navigator) {
        // Vibrate pattern: 500ms on, 200ms off, 500ms on
        navigator.vibrate([500, 200, 500]);
      }
      
      // Show browser notification if supported
      if ('Notification' in window && Notification.permission === 'granted') {
        const callerName = getCallerInfo().map(c => `${c.firstName} ${c.lastName}`).join(', ');
        new Notification(`Incoming ${data.callType} call`, {
          body: `${callerName} is calling you`,
          icon: '/favicon.ico',
          requireInteraction: true
        });
      }
    });

    socket.on('call_ended', () => {
      console.log('Call ended globally');
      setIncomingCall(null);
      setIsRinging(false);
      if (ringtoneRef.current) {
        ringtoneRef.current.pause();
        ringtoneRef.current.currentTime = 0;
      }
    });

    // Handle socket connection events
    socket.on('connect', () => {
      console.log('Socket connected globally');
      if (user?._id) {
        socket.emit('join', user._id);
      }
    });

    socket.on('disconnect', () => {
      console.log('Socket disconnected globally');
    });

    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });

    // Prevent socket cleanup on component unmount to maintain connection
    return () => {
      // Only remove event listeners, don't disconnect socket
      socket.off('incoming_call');
      socket.off('call_ended');
      socket.off('connect');
      socket.off('disconnect');
      socket.off('connect_error');
    };
  }, [user]);

  // Accept/Decline handlers
  const acceptIncomingCall = () => {
    console.log('Accepting incoming call from global handler...');
    setIsRinging(false);
    if (ringtoneRef.current) {
      ringtoneRef.current.pause();
      ringtoneRef.current.currentTime = 0;
    }
    if (incomingCall) {
      console.log('Notifying others of call acceptance from global handler...');
      socket.emit('accept_call', {
        participantIds: incomingCall.participantIds,
        callId: incomingCall.callId || null,
      });
      
      // Store call data in sessionStorage for the Calls page
      sessionStorage.setItem('pendingCall', JSON.stringify({
        ...incomingCall,
        accepted: true,
        timestamp: Date.now()
      }));
    }
    setIncomingCall(null);
    
    // Navigate to calls page to handle the actual call (using React Router)
    navigate('/calls');
  };
  
  const declineIncomingCall = () => {
    console.log('Declining incoming call from global handler...');
    setIsRinging(false);
    if (ringtoneRef.current) {
      ringtoneRef.current.pause();
      ringtoneRef.current.currentTime = 0;
    }
    if (incomingCall) {
      console.log('Notifying others of call decline from global handler...');
      socket.emit('decline_call', {
        participantIds: incomingCall.participantIds,
        callId: incomingCall.callId || null,
      });
    }
    setIncomingCall(null);
  };

  // Helper to get caller info
  const getCallerInfo = () => {
    if (!incomingCall || !incomingCall.participantIds) return [];
    return incomingCall.participantIds
      .filter(pid => pid !== user?._id)
      .map(pid => connections.find(c => c._id === pid))
      .filter(Boolean);
  };

  // Find the caller in your connections
  const caller = incomingCall && connections && incomingCall.callerId
    ? connections.find(c => c._id === incomingCall.callerId)
    : null;

  return (
    <div className="App">
      <audio ref={ringtoneRef} src={RINGTONE_URL} loop />
      {/* Incoming call modal (global) */}
      {isRinging && incomingCall && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-75 z-50">
          <div className="bg-white p-8 rounded-lg shadow-2xl text-center max-w-md w-full mx-4">
            <div className="animate-pulse mb-4">
              <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                </svg>
              </div>
            </div>
            <h2 className="text-2xl font-bold mb-2 text-gray-900">Incoming Call</h2>
            {caller ? (
              <div className="flex flex-col items-center mb-4">
                <img
                  src={caller.photoUrl}
                  alt={caller.firstName}
                  className="w-16 h-16 rounded-full mb-2"
                />
                <span className="font-semibold text-lg">
                  {caller.firstName} {caller.lastName} is calling you
                </span>
              </div>
            ) : (
              <p className="mb-4">Someone is calling you.</p>
            )}
            <div className="flex justify-center space-x-4">
              <button 
                onClick={acceptIncomingCall} 
                className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center space-x-2"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span>Accept</span>
              </button>
              <button 
                onClick={declineIncomingCall} 
                className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center space-x-2"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
                <span>Decline</span>
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-4">
              You can answer this call from anywhere in the app
            </p>
          </div>
        </div>
      )}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#10B981',
              secondary: '#fff',
            },
          },
          error: {
            duration: 5000,
            iconTheme: {
              primary: '#EF4444',
              secondary: '#fff',
            },
          },
        }}
      />
      
      <Routes>
        {/* Public Routes */}
        <Route 
          path="/login" 
          element={
            <PublicRoute>
              <LoginForm />
            </PublicRoute>
          } 
        />
        <Route 
          path="/register" 
          element={
            <PublicRoute>
              <RegisterForm />
            </PublicRoute>
          } 
        />
        
        {/* Protected Routes */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <Layout>
                <Dashboard />
              </Layout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/profile" 
          element={
            <ProtectedRoute>
              <Layout>
                <Profile />
              </Layout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/connections" 
          element={
            <ProtectedRoute>
              <Layout>
                <Connections />
              </Layout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/messages" 
          element={
            <ProtectedRoute>
              <Layout>
                <Messages />
              </Layout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/calls" 
          element={
            <ProtectedRoute>
              <Layout>
                <Calls />
              </Layout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/feed" 
          element={
            <ProtectedRoute>
              <Layout>
                <Feed />
              </Layout>
            </ProtectedRoute>
          } 
        />
        
        {/* Default redirect */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </div>
  );
}

// Main App Component with Router
function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;

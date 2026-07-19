import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

let socket = null;
let initializationPromise = null;

// Helper function to get token from multiple sources
const getAuthToken = () => {
  // Try to get from localStorage first
  const localToken = localStorage.getItem('accessToken');
  if (localToken) {
    console.log('Found token in localStorage');
    return localToken;
  }
  
  // Try to get from cookies
  const cookies = document.cookie.split('; ');
  const tokenCookie = cookies.find(row => row.startsWith('accessToken='));
  if (tokenCookie) {
    const token = tokenCookie.split('=')[1];
    console.log('Found token in cookies');
    return token;
  }
  
  // Try to get from sessionStorage
  const sessionToken = sessionStorage.getItem('accessToken');
  if (sessionToken) {
    console.log('Found token in sessionStorage');
    return sessionToken;
  }
  
  console.warn('No access token found for socket connection');
  return null;
};

export const initializeSocket = async () => {
  // If already initializing, return the existing promise
  if (initializationPromise) {
    return initializationPromise;
  }

  // If socket already exists and is connected, return it
  if (socket && socket.connected) {
    console.log('Socket already connected');
    return socket;
  }

  // Start new initialization
  initializationPromise = new Promise(async (resolve, reject) => {
    try {
      const token = getAuthToken();
      
      console.log('Initializing socket connection to:', SOCKET_URL);
      
      socket = io(SOCKET_URL, {
        auth: { token: token || '' },
        transports: ['polling', 'websocket'], // Try polling first then upgrade to websocket
        withCredentials: true,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        timeout: 20000,
        forceNew: true
      });

      // Connection timeout
      const timeout = setTimeout(() => {
        console.error('Socket connection timeout');
        reject(new Error('Connection timeout'));
      }, 10000);

      socket.on('connect', () => {
        console.log('Socket connected successfully. ID:', socket.id);
        clearTimeout(timeout);
        resolve(socket);
      });

      socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error.message);
        clearTimeout(timeout);
        
        if (error.message === 'Authentication error') {
          console.error('Authentication failed - token may be invalid or expired');
          // Optionally redirect to login
          // window.location.href = '/login';
        }
        
        reject(error);
      });

      socket.on('disconnect', (reason) => {
        console.log('Socket disconnected:', reason);
      });

    } catch (error) {
      console.error('Socket initialization error:', error);
      reject(error);
    }
  });

  try {
    const result = await initializationPromise;
    initializationPromise = null;
    return result;
  } catch (error) {
    initializationPromise = null;
    throw error;
  }
};

export const getSocket = async () => {
  // If socket exists and is connected, return it
  if (socket && socket.connected) {
    return socket;
  }

  // Initialize new socket connection
  return await initializeSocket();
};

export const disconnectSocket = () => {
  if (socket) {
    console.log('Disconnecting socket...');
    socket.disconnect();
    socket = null;
    initializationPromise = null;
  }
};

export const isSocketConnected = () => {
  return socket && socket.connected;
};

export const getSocketId = () => {
  return socket && socket.connected ? socket.id : null;
};
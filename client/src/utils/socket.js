import { io } from 'socket.io-client';
import axios from './axios';

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

let socket = null;

export const initializeSocket = async () => {
  try {
    // Get token from cookie or axios default
    const token = document.cookie.split('; ').find(row => row.startsWith('accessToken='))?.split('=')[1];
    
    socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket'],
      withCredentials: true
    });

    socket.on('connect', () => {
      console.log('Socket connected');
    });

    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });

    return socket;
  } catch (error) {
    console.error('Socket initialization error:', error);
    return null;
  }
};

export const getSocket = () => {
  if (!socket) {
    throw new Error('Socket not initialized. Call initializeSocket first.');
  }
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
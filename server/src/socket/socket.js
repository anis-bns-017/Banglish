import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import Room from '../models/Room.js';
import User from '../models/User.js';

let io;

export const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      credentials: true
    }
  });

  // Middleware for authentication
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        return next(new Error('Authentication error'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId).select('-password');
      
      if (!user) {
        return next(new Error('User not found'));
      }

      socket.user = user;
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.user.username}`);

    // Join room
    socket.on('join-room', async ({ roomId }) => {
      try {
        socket.join(roomId);
        socket.roomId = roomId;
        
        // Update user status in room
        await Room.updateOne(
          { 
            _id: roomId,
            'participants.user': socket.user._id 
          },
          { 
            $set: { 
              'participants.$.isConnected': true,
              'participants.$.socketId': socket.id
            }
          }
        );

        // Notify others
        socket.to(roomId).emit('user-joined', {
          userId: socket.user._id,
          username: socket.user.username
        });

        // Send room participants list
        const room = await Room.findById(roomId)
          .populate('participants.user', 'username fullName avatar');
        
        io.to(roomId).emit('participants-update', room.participants);
      } catch (error) {
        console.error('Join room error:', error);
      }
    });

    // Leave room
    socket.on('leave-room', async () => {
      if (socket.roomId) {
        socket.leave(socket.roomId);
        
        await Room.updateOne(
          { 
            _id: socket.roomId,
            'participants.user': socket.user._id 
          },
          { 
            $set: { 
              'participants.$.isConnected': false,
              'participants.$.socketId': null
            }
          }
        );

        socket.to(socket.roomId).emit('user-left', {
          userId: socket.user._id,
          username: socket.user.username
        });

        socket.roomId = null;
      }
    });

    // Toggle microphone
    socket.on('toggle-mic', async ({ roomId, isMuted }) => {
      await Room.updateOne(
        { 
          _id: roomId,
          'participants.user': socket.user._id 
        },
        { $set: { 'participants.$.isMuted': isMuted } }
      );

      socket.to(roomId).emit('user-mic-changed', {
        userId: socket.user._id,
        isMuted
      });
    });

    // Raise hand
    socket.on('raise-hand', async ({ roomId, raised }) => {
      await Room.updateOne(
        { 
          _id: roomId,
          'participants.user': socket.user._id 
        },
        { $set: { 'participants.$.handRaised': raised } }
      );

      io.to(roomId).emit('hand-raised', {
        userId: socket.user._id,
        raised
      });
    });

    // Speaking indicator
    socket.on('speaking', ({ roomId, isSpeaking }) => {
      socket.to(roomId).emit('user-speaking', {
        userId: socket.user._id,
        isSpeaking
      });
    });

    // WebRTC signaling
    socket.on('offer', ({ targetUserId, offer }) => {
      socket.to(targetUserId).emit('offer', {
        from: socket.user._id,
        offer
      });
    });

    socket.on('answer', ({ targetUserId, answer }) => {
      socket.to(targetUserId).emit('answer', {
        from: socket.user._id,
        answer
      });
    });

    socket.on('ice-candidate', ({ targetUserId, candidate }) => {
      socket.to(targetUserId).emit('ice-candidate', {
        from: socket.user._id,
        candidate
      });
    });

    // Disconnect
    socket.on('disconnect', async () => {
      console.log(`User disconnected: ${socket.user.username}`);
      
      if (socket.roomId) {
        await Room.updateOne(
          { 
            _id: socket.roomId,
            'participants.user': socket.user._id 
          },
          { 
            $set: { 
              'participants.$.isConnected': false,
              'participants.$.socketId': null
            }
          }
        );

        socket.to(socket.roomId).emit('user-left', {
          userId: socket.user._id,
          username: socket.user.username
        });
      }
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
};
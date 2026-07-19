import { useState, useEffect, useRef } from 'react';
import { getSocket, isSocketConnected } from '../../../utils/socket';
import toast from 'react-hot-toast';

const UseRoomSocket = ({
  roomId,
  user,
  setParticipants,
  setMessages,
  setSpeakerQueue,
  setUnreadCount,
  setHandRaised,
  createPeer
}) => {
  const [messages, setLocalMessages] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);
  const [reactions, setReactions] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [socketError, setSocketError] = useState(null);
  
  const typingTimeoutRef = useRef(null);
  const socketRef = useRef(null);
  const listenersSetupRef = useRef(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    
    // Function to initialize socket connection
    const initializeRoomConnection = async () => {
      try {
        console.log('Initializing socket connection for room:', roomId);
        
        // Get socket instance (async)
        const socket = await getSocket();
        
        if (!socket) {
          console.error('Socket instance is null or undefined');
          if (mountedRef.current) {
            setSocketError('Failed to initialize socket connection');
            setIsConnected(false);
          }
          return;
        }

        socketRef.current = socket;
        
        // Check if already connected
        if (socket.connected) {
          console.log('Socket already connected');
          if (mountedRef.current) {
            setIsConnected(true);
            setSocketError(null);
          }
          
          if (!listenersSetupRef.current) {
            setupSocketListeners(socket);
            joinRoom(socket);
          }
        } else {
          // Wait for connection
          console.log('Waiting for socket connection...');
          
          const handleConnect = () => {
            console.log('Socket connected successfully');
            if (mountedRef.current) {
              setIsConnected(true);
              setSocketError(null);
            }
            
            if (!listenersSetupRef.current) {
              setupSocketListeners(socket);
              joinRoom(socket);
            }
          };
          
          const handleConnectError = (error) => {
            console.error('Socket connection error:', error);
            if (mountedRef.current) {
              setSocketError('Connection error. Retrying...');
              setIsConnected(false);
            }
          };
          
          socket.on('connect', handleConnect);
          socket.on('connect_error', handleConnectError);
          
          // Cleanup function for these temporary listeners
          return () => {
            socket.off('connect', handleConnect);
            socket.off('connect_error', handleConnectError);
          };
        }
      } catch (error) {
        console.error('Failed to initialize socket:', error);
        if (mountedRef.current) {
          setSocketError('Failed to initialize connection: ' + error.message);
          setIsConnected(false);
        }
      }
    };

    const joinRoom = (socket) => {
      if (!socket || !socket.connected) {
        console.error('Cannot join room: socket not connected');
        return;
      }

      console.log('Joining room:', roomId);
      socket.emit('join-room', { 
        roomId,
        user: {
          id: user.id,
          username: user.username,
          fullName: user.fullName,
          avatar: user.avatar
        }
      });
    };

    const setupSocketListeners = (socket) => {
      if (!socket || listenersSetupRef.current) return;
      
      console.log('Setting up socket listeners');
      listenersSetupRef.current = true;

      // Remove existing listeners to avoid duplicates
      socket.off('user-joined');
      socket.off('user-left');
      socket.off('participants-update');
      socket.off('user-speaking');
      socket.off('user-mic-changed');
      socket.off('hand-raised');
      socket.off('chat-message');
      socket.off('user-typing');
      socket.off('reaction');
      socket.off('speaker-queue-update');
      socket.off('speaker-approved');
      socket.off('offer');
      socket.off('answer');
      socket.off('ice-candidate');
      socket.off('error');
      socket.off('disconnect');
      socket.off('reconnect');

      // Socket event listeners
      socket.on('user-joined', ({ userId, username }) => {
        console.log(`${username} joined the room`);
        toast.success(`${username} joined the room`);
      });

      socket.on('user-left', ({ userId, username }) => {
        console.log(`${username} left the room`);
        toast(`${username} left the room`);
      });

      socket.on('participants-update', (updatedParticipants) => {
        console.log('Participants updated:', updatedParticipants?.length);
        if (setParticipants && updatedParticipants) {
          setParticipants(updatedParticipants);
        }
      });

      socket.on('user-speaking', ({ userId, isSpeaking }) => {
        // This will be handled by useWebRTC
        // You can add active speakers state here if needed
      });

      socket.on('user-mic-changed', ({ userId, isMuted }) => {
        if (setParticipants) {
          setParticipants(prev => 
            prev.map(p => 
              p.user?._id === userId ? { ...p, isMuted } : p
            )
          );
        }
      });

      socket.on('hand-raised', ({ userId, raised }) => {
        if (setParticipants) {
          setParticipants(prev => 
            prev.map(p => 
              p.user?._id === userId ? { ...p, handRaised: raised } : p
            )
          );
        }
        if (userId === user.id && setHandRaised) {
          setHandRaised(raised);
        }
      });

      socket.on('chat-message', (message) => {
        console.log('New chat message:', message);
        setLocalMessages(prev => [...prev, message]);
        if (setMessages) {
          setMessages(prev => [...prev, message]);
        }
        if (setUnreadCount) {
          setUnreadCount(prev => prev + 1);
        }
      });

      socket.on('user-typing', ({ userId, isTyping }) => {
        setTypingUsers(prev => {
          if (isTyping && !prev.includes(userId)) {
            return [...prev, userId];
          } else if (!isTyping) {
            return prev.filter(id => id !== userId);
          }
          return prev;
        });
      });

      socket.on('reaction', ({ userId, reaction }) => {
        const newReaction = {
          id: Date.now() + Math.random(),
          userId,
          emoji: reaction,
          x: Math.random() * 80 + 10
        };
        setReactions(prev => [...prev, newReaction]);
        
        setTimeout(() => {
          setReactions(prev => prev.filter(r => r.id !== newReaction.id));
        }, 3000);
      });

      socket.on('speaker-queue-update', (queue) => {
        if (setSpeakerQueue) {
          setSpeakerQueue(queue);
        }
      });

      socket.on('speaker-approved', () => {
        toast.success('You can now speak!');
      });

      // WebRTC signaling
      socket.on('offer', ({ from, offer }) => {
        if (createPeer) {
          const peer = createPeer(from, true);
          if (peer && peer.signal) {
            peer.signal(offer);
          }
        }
      });

      socket.on('answer', ({ from, answer }) => {
        console.log('Received answer from:', from);
      });

      socket.on('ice-candidate', ({ from, candidate }) => {
        console.log('Received ICE candidate from:', from);
      });

      socket.on('error', (error) => {
        console.error('Socket error:', error);
        toast.error(error.message || 'Socket connection error');
      });

      socket.on('disconnect', (reason) => {
        console.log('Socket disconnected:', reason);
        if (mountedRef.current) {
          setIsConnected(false);
          if (reason === 'io server disconnect') {
            // Server disconnected, attempt to reconnect
            socket.connect();
          }
        }
      });

      socket.on('reconnect', (attemptNumber) => {
        console.log('Socket reconnected after', attemptNumber, 'attempts');
        if (mountedRef.current) {
          setIsConnected(true);
          setSocketError(null);
          // Rejoin the room
          joinRoom(socket);
        }
      });
    };

    initializeRoomConnection();

    // Cleanup
    return () => {
      mountedRef.current = false;
      if (socketRef.current && socketRef.current.connected) {
        console.log('Leaving room:', roomId);
        socketRef.current.emit('leave-room', { roomId });
      }
      listenersSetupRef.current = false;
      
      // Clear typing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [roomId, user.id]); // Only re-run if roomId or userId changes

  const sendMessage = (content) => {
    const socket = socketRef.current;
    if (!socket || !socket.connected) {
      console.error('Cannot send message: socket not connected');
      toast.error('Not connected to room');
      return;
    }

    const message = {
      id: Date.now(),
      userId: user.id,
      username: user.username,
      fullName: user.fullName,
      avatar: user.avatar,
      content,
      timestamp: new Date().toISOString()
    };

    socket.emit('chat-message', { roomId, message });
    setLocalMessages(prev => [...prev, message]);
    if (setMessages) {
      setMessages(prev => [...prev, message]);
    }
  };

  const sendReaction = (emoji) => {
    const socket = socketRef.current;
    if (!socket || !socket.connected) {
      console.error('Cannot send reaction: socket not connected');
      return;
    }

    socket.emit('reaction', { roomId, reaction: emoji });
    
    const newReaction = {
      id: Date.now(),
      userId: user.id,
      emoji,
      x: Math.random() * 80 + 10
    };
    
    setReactions(prev => [...prev, newReaction]);
    
    setTimeout(() => {
      setReactions(prev => prev.filter(r => r.id !== newReaction.id));
    }, 3000);
  };

  const sendTyping = (isTyping) => {
    const socket = socketRef.current;
    if (!socket || !socket.connected) return;

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    socket.emit('typing', { roomId, isTyping });
    
    // Auto-stop typing after 2 seconds
    if (isTyping) {
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit('typing', { roomId, isTyping: false });
      }, 2000);
    }
  };

  const requestSpeak = (topic = '') => {
    const socket = socketRef.current;
    if (!socket || !socket.connected) {
      toast.error('Not connected to room');
      return;
    }

    socket.emit('request-speak', { roomId, topic });
    toast.success('Request sent to moderators');
  };

  const approveSpeaker = (userId) => {
    const socket = socketRef.current;
    if (!socket || !socket.connected) return;
    socket.emit('approve-speaker', { roomId, userId });
  };

  const rejectSpeaker = (userId) => {
    const socket = socketRef.current;
    if (!socket || !socket.connected) return;
    socket.emit('reject-speaker', { roomId, userId });
  };

  const muteUser = (userId) => {
    const socket = socketRef.current;
    if (!socket || !socket.connected) return;
    socket.emit('mute-user', { roomId, userId });
  };

  const unmuteUser = (userId) => {
    const socket = socketRef.current;
    if (!socket || !socket.connected) return;
    socket.emit('unmute-user', { roomId, userId });
  };

  const removeUser = (userId) => {
    const socket = socketRef.current;
    if (!socket || !socket.connected) return;
    socket.emit('remove-user', { roomId, userId });
  };

  return {
    messages,
    setMessages: setLocalMessages,
    typingUsers,
    reactions,
    isConnected,
    socketError,
    sendMessage,
    sendReaction,
    sendTyping,
    requestSpeak,
    approveSpeaker,
    rejectSpeaker,
    muteUser,
    unmuteUser,
    removeUser
  };
};

export default UseRoomSocket;
import { useState, useEffect, useRef } from 'react';
import { getSocket } from '../../../utils/socket';
import toast from 'react-hot-toast';

const UseRoomSocket = ({
  roomId,
  user,
  participants,
  setParticipants,
  setMessages,
  setSpeakerQueue,
  setUnreadCount,
  activeSpeakers,
  isMuted,
  setIsMuted,
  handRaised,
  setHandRaised,
  createPeer
}) => {
  const [messages, setLocalMessages] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);
  const [reactions, setReactions] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    const socket = getSocket();
    
    if (!socket) {
      console.log('Socket not available yet');
      return;
    }

    setIsConnected(true);
    console.log('Socket connected in room');

    // Join room
    socket.emit('join-room', { 
      roomId,
      user: {
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        avatar: user.avatar
      }
    });

    // Socket event listeners
    socket.on('user-joined', ({ userId, username }) => {
      toast.success(`${username} joined the room`);
    });

    socket.on('user-left', ({ userId, username }) => {
      toast(`${username} left the room`);
    });

    socket.on('participants-update', (updatedParticipants) => {
      setParticipants(updatedParticipants);
    });

    socket.on('user-speaking', ({ userId, isSpeaking }) => {
      if (activeSpeakers) {
        // This will be handled by useWebRTC
      }
    });

    socket.on('user-mic-changed', ({ userId, isMuted }) => {
      setParticipants(prev => 
        prev.map(p => 
          p.user._id === userId ? { ...p, isMuted } : p
        )
      );
    });

    socket.on('hand-raised', ({ userId, raised }) => {
      setParticipants(prev => 
        prev.map(p => 
          p.user._id === userId ? { ...p, handRaised: raised } : p
        )
      );
    });

    socket.on('chat-message', (message) => {
      setMessages(prev => [...prev, message]);
      setUnreadCount(prev => prev + 1);
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
        x: Math.random() * 80 + 10 // Random position
      };
      setReactions(prev => [...prev, newReaction]);
      
      // Remove after animation
      setTimeout(() => {
        setReactions(prev => prev.filter(r => r.id !== newReaction.id));
      }, 3000);
    });

    socket.on('speaker-queue-update', (queue) => {
      setSpeakerQueue(queue);
    });

    socket.on('speaker-approved', () => {
      toast.success('You can now speak!');
    });

    // WebRTC signaling
    socket.on('offer', ({ from, offer }) => {
      const peer = createPeer(from, true);
      if (peer) {
        peer.signal(offer);
      }
    });

    socket.on('answer', ({ from, answer }) => {
      // Answer will be handled by the peer that initiated
    });

    socket.on('ice-candidate', ({ from, candidate }) => {
      // ICE candidates will be handled by the peer
    });

    // Cleanup
    return () => {
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
    };
  }, [roomId, user.id]);

  const sendMessage = (content) => {
    const socket = getSocket();
    if (!socket) return;

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
    setMessages(prev => [...prev, message]);
  };

  const sendReaction = (emoji) => {
    const socket = getSocket();
    if (!socket) return;

    socket.emit('reaction', { roomId, reaction: emoji });
    
    // Show local reaction
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
    const socket = getSocket();
    if (!socket) return;

    socket.emit('typing', { roomId, isTyping });
  };

  const requestSpeak = (topic = '') => {
    const socket = getSocket();
    if (!socket) return;

    socket.emit('request-speak', { roomId, topic });
    toast.success('Request sent to moderators');
  };

  const approveSpeaker = (userId) => {
    const socket = getSocket();
    if (!socket) return;

    socket.emit('approve-speaker', { roomId, userId });
  };

  const rejectSpeaker = (userId) => {
    const socket = getSocket();
    if (!socket) return;

    socket.emit('reject-speaker', { roomId, userId });
  };

  const muteUser = (userId) => {
    const socket = getSocket();
    if (!socket) return;

    socket.emit('mute-user', { roomId, userId });
  };

  const unmuteUser = (userId) => {
    const socket = getSocket();
    if (!socket) return;

    socket.emit('unmute-user', { roomId, userId });
  };

  const removeUser = (userId) => {
    const socket = getSocket();
    if (!socket) return;

    socket.emit('remove-user', { roomId, userId });
  };

  return {
    messages,
    setMessages,
    typingUsers,
    reactions,
    isConnected,
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
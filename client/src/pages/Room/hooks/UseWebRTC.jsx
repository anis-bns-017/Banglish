import { useState, useRef, useEffect } from 'react';
import Peer from 'simple-peer';
import toast from 'react-hot-toast';

const UseWebRTC = (roomId, user, localStream, isDeafened, volume) => {
  const [peers, setPeers] = useState({});
  const [activeSpeakers, setActiveSpeakers] = useState(new Set());
  
  const peersRef = useRef({});
  const streamsRef = useRef({});

  // Update volume for all peers when deafened or volume changes
  useEffect(() => {
    const audioElements = document.querySelectorAll('#remote-audio-container audio');
    audioElements.forEach(audio => {
      audio.volume = isDeafened ? 0 : volume / 100;
    });
  }, [isDeafened, volume]);

  const createPeer = (targetUserId, initiator = false, stream = localStream) => {
    if (!stream) {
      console.log('No local stream available yet');
      return null;
    }

    const peer = new Peer({
      initiator,
      trickle: false,
      stream: stream,
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
          { urls: 'stun:stun2.l.google.com:19302' },
          { urls: 'stun:stun3.l.google.com:19302' },
          { urls: 'stun:stun4.l.google.com:19302' }
        ]
      }
    });

    peer.on('signal', (signal) => {
      // This will be handled by socket events in the parent
      console.log('Signal generated for peer:', targetUserId);
    });

    peer.on('stream', (remoteStream) => {
      console.log('Received stream from:', targetUserId);
      streamsRef.current[targetUserId] = remoteStream;
      
      // Create audio element for remote stream
      let audioElement = document.querySelector(`#remote-audio-${targetUserId}`);
      
      if (!audioElement) {
        audioElement = document.createElement('audio');
        audioElement.id = `remote-audio-${targetUserId}`;
        audioElement.autoplay = true;
        audioElement.volume = isDeafened ? 0 : volume / 100;
        document.getElementById('remote-audio-container')?.appendChild(audioElement);
      }
      
      audioElement.srcObject = remoteStream;
    });

    peer.on('error', (err) => {
      console.error('Peer error:', err);
    });

    peer.on('close', () => {
      console.log('Peer connection closed:', targetUserId);
      const audioElement = document.querySelector(`#remote-audio-${targetUserId}`);
      if (audioElement) {
        audioElement.remove();
      }
    });

    peersRef.current[targetUserId] = peer;
    setPeers(prev => ({ ...prev, [targetUserId]: peer }));

    return peer;
  };

  const removePeer = (userId) => {
    if (peersRef.current[userId]) {
      peersRef.current[userId].destroy();
      delete peersRef.current[userId];
      
      const audioElement = document.querySelector(`#remote-audio-${userId}`);
      if (audioElement) {
        audioElement.remove();
      }
      
      setPeers(prev => {
        const newPeers = { ...prev };
        delete newPeers[userId];
        return newPeers;
      });
    }
  };

  const setSpeakerActive = (userId, isSpeaking) => {
    setActiveSpeakers(prev => {
      const newSet = new Set(prev);
      if (isSpeaking) {
        newSet.add(userId);
      } else {
        newSet.delete(userId);
      }
      return newSet;
    });
  };

  return {
    peers: peersRef.current,
    activeSpeakers,
    createPeer,
    removePeer,
    setSpeakerActive
  };
};

export default UseWebRTC;
import { useState, useEffect } from 'react';

const UseParticipants = (roomId, currentUser) => {
  const [participants, setParticipants] = useState([]);
  const [userRole, setUserRole] = useState('listener');
  const [isHost, setIsHost] = useState(false);
  const [isModerator, setIsModerator] = useState(false);
  const [isSpeaker, setIsSpeaker] = useState(false);
  const [handRaised, setHandRaised] = useState(false);
  const [speakerQueue, setSpeakerQueue] = useState([]);

  // Update user role when participants change
  useEffect(() => {
    if (!currentUser || participants.length === 0) return;

    const currentParticipant = participants.find(
      p => p.user._id === currentUser.id
    );

    if (currentParticipant) {
      setUserRole(currentParticipant.role);
      setIsHost(currentParticipant.role === 'host');
      setIsModerator(currentParticipant.role === 'moderator' || currentParticipant.role === 'host');
      setIsSpeaker(currentParticipant.role === 'speaker' || currentParticipant.role === 'host');
      setHandRaised(currentParticipant.handRaised || false);
    }
  }, [participants, currentUser]);

  const getParticipantsByRole = () => {
    return {
      hosts: participants.filter(p => p.role === 'host'),
      moderators: participants.filter(p => p.role === 'moderator' && p.role !== 'host'),
      speakers: participants.filter(p => p.role === 'speaker'),
      listeners: participants.filter(p => p.role === 'listener')
    };
  };

  const getParticipant = (userId) => {
    return participants.find(p => p.user._id === userId);
  };

  const updateParticipant = (userId, updates) => {
    setParticipants(prev =>
      prev.map(p =>
        p.user._id === userId ? { ...p, ...updates } : p
      )
    );
  };

  const removeParticipant = (userId) => {
    setParticipants(prev => prev.filter(p => p.user._id !== userId));
  };

  const isCurrentUserModerator = (userId) => {
    const participant = getParticipant(userId);
    return participant?.role === 'moderator' || participant?.role === 'host';
  };

  const canModerate = (userId) => {
    if (isHost) return true;
    if (!isModerator) return false;
    
    const targetParticipant = getParticipant(userId);
    return targetParticipant?.role !== 'host' && targetParticipant?.role !== 'moderator';
  };

  return {
    participants,
    setParticipants,
    userRole,
    isHost,
    isModerator,
    isSpeaker,
    handRaised,
    setHandRaised,
    speakerQueue,
    setSpeakerQueue,
    getParticipantsByRole,
    getParticipant,
    updateParticipant,
    removeParticipant,
    isCurrentUserModerator,
    canModerate
  };
};

export default UseParticipants;
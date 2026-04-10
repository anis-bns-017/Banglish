import React from 'react';
import ParticipantCard from './ParticipantCard';

const ParticipantsGrid = ({
  participants,
  activeSpeakers,
  currentUser,
  isHost,
  isModerator,
  viewMode,
  onMuteUser,
  onMakeSpeaker,
  onMakeListener,
  onRemoveUser
}) => {
  // Separate host, moderators, speakers, and listeners
  const hosts = participants.filter(p => p.role === 'host');
  const moderators = participants.filter(p => p.role === 'moderator' && p.user._id !== participants.find(h => h.role === 'host')?.user._id);
  const speakers = participants.filter(p => p.role === 'speaker');
  const listeners = participants.filter(p => p.role === 'listener');

  const renderSection = (title, users, icon) => {
    if (users.length === 0) return null;
    
    return (
      <div className="mb-6">
        <div className="flex items-center mb-3 text-sm text-gray-400">
          {icon}
          <span className="ml-2">{title} • {users.length}</span>
        </div>
        <div className={viewMode === 'grid' 
          ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4"
          : "space-y-2"
        }>
          {users.map(participant => (
            <ParticipantCard
              key={participant.user._id}
              participant={participant}
              isActiveSpeaker={activeSpeakers.has(participant.user._id)}
              isCurrentUser={participant.user._id === currentUser?.id}
              canModerate={isHost || (isModerator && participant.role !== 'host' && participant.role !== 'moderator')}
              viewMode={viewMode}
              onMute={() => onMuteUser(participant.user._id)}
              onMakeSpeaker={() => onMakeSpeaker(participant.user._id)}
              onMakeListener={() => onMakeListener(participant.user._id)}
              onRemove={() => onRemoveUser(participant.user._id)}
            />
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="participants-grid">
      {renderSection('Host', hosts, <span className="text-yellow-500">👑</span>)}
      {renderSection('Moderators', moderators, <span className="text-purple-500">🛡️</span>)}
      {renderSection('Speakers', speakers, <span className="text-green-500">🎤</span>)}
      {renderSection('Listeners', listeners, <span className="text-blue-500">👂</span>)}
    </div>
  );
};

export default ParticipantsGrid;
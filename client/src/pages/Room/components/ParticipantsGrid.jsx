import React, { useState } from 'react';
import { 
  Mic, MicOff, Crown, Shield, Star,
  Hand, Volume2, MoreVertical, UserMinus,
  Headphones, VolumeX, User
} from 'lucide-react';

const ParticipantCard = ({
  participant,
  isActiveSpeaker,
  isCurrentUser,
  canModerate,
  viewMode,
  onMute,
  onMakeSpeaker,
  onMakeListener,
  onRemove
}) => {
  const [showMenu, setShowMenu] = useState(false);

  // Guard against null participant
  if (!participant || !participant.user) {
    return null;
  }

  const { user, role, isMuted, handRaised } = participant;
  const { _id, username, fullName, avatar, isCreator } = user;

  const getRoleIcon = () => {
    switch(role) {
      case 'host': return <Crown className="h-3 w-3 text-yellow-500" />;
      case 'moderator': return <Shield className="h-3 w-3 text-purple-500" />;
      case 'speaker': return <Mic className="h-3 w-3 text-green-500" />;
      default: return null;
    }
  };

  const getRoleBadge = () => {
    switch(role) {
      case 'host': return 'bg-yellow-500/20 text-yellow-400';
      case 'moderator': return 'bg-purple-500/20 text-purple-400';
      case 'speaker': return 'bg-green-500/20 text-green-400';
      default: return 'bg-blue-500/20 text-blue-400';
    }
  };

  if (viewMode === 'grid') {
    return (
      <div className={`relative group bg-gray-800/50 backdrop-blur-sm rounded-lg p-4 border transition-all ${
        isActiveSpeaker 
          ? 'border-green-500 ring-2 ring-green-500/50' 
          : 'border-gray-700 hover:border-indigo-500'
      }`}>
        {/* Speaking Animation */}
        {isActiveSpeaker && (
          <div className="absolute inset-0 rounded-lg bg-green-500/5 animate-pulse"></div>
        )}

        {/* Avatar */}
        <div className="relative mb-3">
          {avatar ? (
            <img
              src={avatar}
              alt={username}
              className="w-20 h-20 rounded-full mx-auto object-cover"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 mx-auto flex items-center justify-center text-2xl font-bold text-white">
              {username?.charAt(0).toUpperCase() || <User className="h-8 w-8" />}
            </div>
          )}

          {/* Status Badges */}
          <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 flex space-x-1">
            <div className={`px-2 py-0.5 rounded-full text-xs font-medium ${getRoleBadge()}`}>
              {role}
            </div>
          </div>

          {/* Mic Status */}
          <div className={`absolute top-0 right-0 w-6 h-6 rounded-full flex items-center justify-center ${
            isMuted ? 'bg-red-500' : 'bg-green-500'
          }`}>
            {isMuted ? (
              <MicOff className="h-3 w-3 text-white" />
            ) : (
              <Mic className="h-3 w-3 text-white" />
            )}
          </div>

          {/* Hand Raised */}
          {handRaised && (
            <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 animate-bounce">
              <div className="w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center">
                <Hand className="h-3 w-3 text-white" />
              </div>
            </div>
          )}
        </div>

        {/* User Info */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-1">
            <p className="font-medium truncate max-w-[120px]">
              {fullName || username}
            </p>
            {getRoleIcon()}
            {isCreator && (
              <Star className="h-3 w-3 text-yellow-400 fill-current" />
            )}
          </div>
          <p className="text-xs text-gray-400">
            @{username}
            {isCurrentUser && ' (you)'}
          </p>
        </div>

        {/* Moderation Menu */}
        {canModerate && !isCurrentUser && (
          <div className="absolute top-2 right-2">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1 bg-gray-700 rounded hover:bg-gray-600 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <MoreVertical className="h-4 w-4" />
            </button>

            {showMenu && (
              <div className="absolute right-0 mt-1 w-48 bg-gray-800 rounded-lg shadow-xl py-1 z-10 border border-gray-700">
                <button
                  onClick={() => { onMute?.(); setShowMenu(false); }}
                  className="w-full px-4 py-2 text-left hover:bg-gray-700 text-sm flex items-center gap-2"
                >
                  {isMuted ? (
                    <>
                      <Mic className="h-4 w-4 text-green-400" />
                      Unmute
                    </>
                  ) : (
                    <>
                      <MicOff className="h-4 w-4 text-red-400" />
                      Mute
                    </>
                  )}
                </button>

                {role === 'speaker' ? (
                  <button
                    onClick={() => { onMakeListener?.(); setShowMenu(false); }}
                    className="w-full px-4 py-2 text-left hover:bg-gray-700 text-sm flex items-center gap-2"
                  >
                    <Headphones className="h-4 w-4" />
                    Make Listener
                  </button>
                ) : (
                  <button
                    onClick={() => { onMakeSpeaker?.(); setShowMenu(false); }}
                    className="w-full px-4 py-2 text-left hover:bg-gray-700 text-sm flex items-center gap-2"
                  >
                    <Mic className="h-4 w-4" />
                    Make Speaker
                  </button>
                )}

                <button
                  onClick={() => { onRemove?.(); setShowMenu(false); }}
                  className="w-full px-4 py-2 text-left hover:bg-gray-700 text-sm flex items-center gap-2 text-red-400"
                >
                  <UserMinus className="h-4 w-4" />
                  Remove from Room
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // List view
  return (
    <div className="flex items-center bg-gray-800/30 rounded-lg p-3 hover:bg-gray-800/50 transition-colors">
      {/* Avatar */}
      <div className="relative mr-3">
        {avatar ? (
          <img src={avatar} alt={username} className="w-10 h-10 rounded-full object-cover" />
        ) : (
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-sm font-bold text-white">
            {username?.charAt(0).toUpperCase() || <User className="h-5 w-5" />}
          </div>
        )}

        {/* Active Speaker Indicator */}
        {isActiveSpeaker && (
          <div className="absolute -inset-0.5 rounded-full border-2 border-green-500 animate-pulse"></div>
        )}
      </div>

      {/* User Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1">
          <p className="font-medium truncate">
            {fullName || username}
          </p>
          {getRoleIcon()}
          {isCreator && (
            <Star className="h-3 w-3 text-yellow-400 fill-current" />
          )}
        </div>
        <p className="text-xs text-gray-400 truncate">
          @{username}
          {isCurrentUser && ' (you)'}
        </p>
      </div>

      {/* Status Icons */}
      <div className="flex items-center gap-2">
        {/* Hand Raised */}
        {handRaised && (
          <div className="p-1 bg-yellow-500/20 rounded">
            <Hand className="h-4 w-4 text-yellow-400" />
          </div>
        )}

        {/* Mic Status */}
        <div className={`p-1 rounded ${isMuted ? 'bg-red-500/20' : 'bg-green-500/20'}`}>
          {isMuted ? (
            <MicOff className="h-4 w-4 text-red-400" />
          ) : (
            <Mic className="h-4 w-4 text-green-400" />
          )}
        </div>

        {/* Role Badge */}
        <span className={`px-2 py-1 rounded-full text-xs ${getRoleBadge()}`}>
          {role}
        </span>
      </div>
    </div>
  );
};

export default ParticipantCard;
import React from 'react';
import {
  Mic, MicOff, Headphones,
  Volume2, VolumeX, Hand, MessageCircle,
  Users, Smile
} from 'lucide-react';

const ControlBar = ({
  isMuted,
  onToggleMute,
  isDeafened,
  onToggleDeafen,
  volume,
  onVolumeChange,
  isSpeaker,
  handRaised,
  onToggleHand,
  onRequestSpeak,
  onToggleChat,
  showChat,
  unreadCount,
  participantCount,
  queueCount,
  onReaction
}) => {
  return (
    <div className="bg-gray-800/50 backdrop-blur-lg border-t border-gray-700 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Left Controls */}
        <div className="flex items-center space-x-3">
          {/* Mute Button */}
          <button
            onClick={onToggleMute}
            className={`p-3 rounded-lg transition-colors ${
              isMuted 
                ? 'bg-red-600 hover:bg-red-700' 
                : 'bg-gray-700 hover:bg-gray-600'
            }`}
            title={isMuted ? 'Unmute (Ctrl+M)' : 'Mute (Ctrl+M)'}
          >
            {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
          </button>

          {/* Deafen Button */}
          <button
            onClick={onToggleDeafen}
            className={`p-3 rounded-lg transition-colors ${
              isDeafened 
                ? 'bg-red-600 hover:bg-red-700' 
                : 'bg-gray-700 hover:bg-gray-600'
            }`}
            title={isDeafened ? 'Undeafen (Ctrl+D)' : 'Deafen (Ctrl+D)'}
          >
            {isDeafened ? <Headphones className="h-5 w-5 text-red-600" /> : <Headphones className="h-5 w-5" />}
          </button>

          {/* Volume Slider */}
          <div className="flex items-center space-x-2 px-3 py-1 bg-gray-700 rounded-lg">
            <VolumeX className="h-4 w-4 text-gray-400" />
            <input
              type="range"
              min="0"
              max="100"
              value={volume}
              onChange={(e) => onVolumeChange(parseInt(e.target.value))}
              className="w-24"
            />
            <Volume2 className="h-4 w-4 text-gray-400" />
          </div>
        </div>

        {/* Center Controls */}
        <div className="flex items-center space-x-3">
          {/* Raise Hand (for listeners) */}
          {!isSpeaker && (
            <button
              onClick={onToggleHand}
              className={`p-3 rounded-lg transition-colors ${
                handRaised
                  ? 'bg-yellow-600 hover:bg-yellow-700'
                  : 'bg-gray-700 hover:bg-gray-600'
              }`}
              title={handRaised ? 'Lower hand' : 'Raise hand'}
            >
              <Hand className="h-5 w-5" />
            </button>
          )}

          {/* Request to Speak (for listeners) */}
          {!isSpeaker && (
            <button
              onClick={onRequestSpeak}
              className="px-4 py-2 bg-indigo-600 rounded-lg hover:bg-indigo-700 text-sm font-medium"
            >
              Request to Speak
            </button>
          )}

          {/* Reactions */}
          <button
            onClick={() => onReaction('👍')}
            className="p-3 bg-gray-700 hover:bg-gray-600 rounded-lg"
            title="React"
          >
            <Smile className="h-5 w-5" />
          </button>
        </div>

        {/* Right Controls */}
        <div className="flex items-center space-x-3">
          {/* Participant Count */}
          <button
            className="flex items-center space-x-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg"
          >
            <Users className="h-5 w-5" />
            <span>{participantCount}</span>
            {queueCount > 0 && (
              <span className="px-1.5 py-0.5 bg-yellow-500 text-xs rounded-full">
                {queueCount}
              </span>
            )}
          </button>

          {/* Chat Toggle */}
          <button
            onClick={onToggleChat}
            className={`p-3 rounded-lg transition-colors relative ${
              showChat ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-gray-700 hover:bg-gray-600'
            }`}
            title="Toggle chat"
          >
            <MessageCircle className="h-5 w-5" />
            {unreadCount > 0 && !showChat && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-xs flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </div> 
  );
};

export default ControlBar;
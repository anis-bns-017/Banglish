import React, { useState } from 'react';
import { 
  ChevronDown, Users, Globe, Lock, 
  Share2, Settings, Maximize2, Minimize2,
  Grid, List, Copy, Check, LogOut
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const RoomHeader = ({
  room,
  onLeave,
  onInvite,
  onSettings,
  onFullscreen,
  onViewModeChange,
  viewMode,
  showSettings
}) => {
  const navigate = useNavigate();
  const [showInvite, setShowInvite] = useState(false);
  const [copied, setCopied] = useState(false);

  const copyInviteLink = () => {
    const link = `${window.location.origin}/room/${room._id}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    toast.success('Invite link copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-gray-800/50 backdrop-blur-lg border-b border-gray-700 px-6 py-3">
      <div className="flex items-center justify-between">
        {/* Left Section */}
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/rooms')}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
            title="Back to rooms"
          >
            <ChevronDown className="h-5 w-5 rotate-90" />
          </button>
          
          <div>
            <h1 className="text-xl font-semibold flex items-center">
              {room.name}
              {room.isPrivate ? (
                <Lock className="h-4 w-4 ml-2 text-yellow-500" />
              ) : (
                <Globe className="h-4 w-4 ml-2 text-green-500" />
              )}
            </h1>
            <div className="flex items-center space-x-3 text-sm text-gray-400">
              <span className="flex items-center">
                <Users className="h-4 w-4 mr-1" />
                {room.participantCount} participants
              </span>
              <span>•</span>
              <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-400 rounded-full">
                {room.category}
              </span>
              {room.host && (
                <>
                  <span>•</span>
                  <span className="flex items-center">
                    Hosted by {room.host.username}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center space-x-2">
          {/* View Toggle */}
          <button
            onClick={onViewModeChange}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
            title={viewMode === 'grid' ? 'List view' : 'Grid view'}
          >
            {viewMode === 'grid' ? <List className="h-5 w-5" /> : <Grid className="h-5 w-5" />}
          </button>

          {/* Fullscreen */}
          <button
            onClick={onFullscreen}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
            title="Toggle fullscreen"
          >
            <Maximize2 className="h-5 w-5" />
          </button>

          {/* Invite */}
          <div className="relative">
            <button
              onClick={() => setShowInvite(!showInvite)}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
              title="Invite people"
            >
              <Share2 className="h-5 w-5" />
            </button>

            {showInvite && (
              <div className="absolute top-12 right-0 bg-gray-800 rounded-lg shadow-xl p-4 z-20 w-80 border border-gray-700">
                <h3 className="font-medium mb-3">Invite to Room</h3>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={`${window.location.origin}/room/${room._id}`}
                    readOnly
                    className="flex-1 px-3 py-2 bg-gray-700 rounded-lg text-sm"
                  />
                  <button
                    onClick={copyInviteLink}
                    className="p-2 bg-indigo-600 rounded-lg hover:bg-indigo-700"
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  Anyone with this link can join this room
                </p>
              </div>
            )}
          </div>

          {/* Settings */}
          <button
            onClick={onSettings}
            className={`p-2 rounded-lg transition-colors ${
              showSettings ? 'bg-indigo-600' : 'hover:bg-gray-700'
            }`}
            title="Audio settings"
          >
            <Settings className="h-5 w-5" />
          </button>

          {/* Leave */}
          <button
            onClick={onLeave}
            className="flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors ml-2"
          >
            <LogOut className="h-4 w-4" />
            <span>Leave</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default RoomHeader;
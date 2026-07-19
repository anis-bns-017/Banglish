import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import axios from '../../utils/axios';
import { initializeSocket, disconnectSocket } from '../../utils/socket';
import toast from 'react-hot-toast';

// Components
import RoomHeader from './components/RoomHeader';
import ParticipantsGrid from './components/ParticipantsGrid';
import ChatSidebar from './components/ChatSidebar';
import ControlBar from './components/ControlBar';
import SpeakerQueue from './components/SpeakerQueue';
import Reactions from './components/Reactions';
import AudioSettings from './components/AudioSettings';

// Hooks
import UseAudio from './hooks/UseAudio';
import UseWebRTC from './hooks/UseWebRTC';
import UseRoomSocket from './hooks/UseRoomSocket';
import UseParticipants from './hooks/UseParticipants';

const Room = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  // UI State
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showChat, setShowChat] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [fullscreen, setFullscreen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [messages, setMessages] = useState([]);

  // Custom hooks
  const {
    participants,
    setParticipants,
    userRole,
    isHost,
    isModerator,
    isSpeaker,
    handRaised,
    setHandRaised,
    speakerQueue,
    setSpeakerQueue
  } = UseParticipants(roomId, user);

  const {
    isMuted,
    setIsMuted,
    isDeafened,
    setIsDeafened,
    volume,
    setVolume,
    audioDevices,
    selectedDevice,
    changeDevice,
    localStream
  } = UseAudio();

  const {
    peers,
    activeSpeakers,
    createPeer
  } = UseWebRTC(roomId, user, localStream, isDeafened, volume);

  const {
    typingUsers,
    sendMessage,
    sendReaction,
    reactions
  } = UseRoomSocket({
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
  });

  // Fetch room data
  useEffect(() => {
    fetchRoom();
    return () => {
      disconnectSocket();
    };
  }, [roomId]);

  const fetchRoom = async () => {
    try {
      const response = await axios.get(`/rooms/${roomId}`);
      setRoom(response.data.room);
      setParticipants(response.data.room.participants);
    } catch (error) {
      toast.error('Failed to load room');
      navigate('/rooms');
    } finally {
      setLoading(false);
    }
  };

  const leaveRoom = async () => {
    try {
      await axios.post(`/rooms/${roomId}/leave`);
      disconnectSocket();
      navigate('/rooms');
    } catch (error) {
      console.error('Failed to leave:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className={`h-screen flex flex-col bg-gray-900 text-white ${fullscreen ? 'fixed inset-0 z-50' : ''}`}>
      {/* Header */}
      <RoomHeader
        room={room}
        onLeave={leaveRoom}
        onInvite={() => {}}
        onSettings={() => setShowSettings(!showSettings)}
        onFullscreen={() => setFullscreen(!fullscreen)}
        onViewModeChange={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
        viewMode={viewMode}
        showSettings={showSettings}
      />

      {/* Audio Settings Modal */}
      {showSettings && (
        <AudioSettings
          devices={audioDevices}
          selectedDevice={selectedDevice}
          onChangeDevice={changeDevice}
          volume={volume}
          onVolumeChange={setVolume}
          onClose={() => setShowSettings(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Participants Area */}
        <div className={`flex-1 ${showChat ? 'w-2/3' : 'w-full'} overflow-y-auto p-6`}>
          {/* Speaker Queue (visible to mods) */}
          {(isHost || isModerator) && speakerQueue.length > 0 && (
            <SpeakerQueue
              queue={speakerQueue}
              onApprove={(userId) => {}}
              onReject={(userId) => {}}
            />
          )}

          {/* Participants Grid */}
          <ParticipantsGrid
            participants={participants}
            activeSpeakers={activeSpeakers}
            currentUser={user}
            isHost={isHost}
            isModerator={isModerator}
            viewMode={viewMode}
            onMuteUser={(userId) => {}}
            onMakeSpeaker={(userId) => {}}
            onMakeListener={(userId) => {}}
            onRemoveUser={(userId) => {}}
          />
        </div>

        {/* Chat Sidebar */}
        {showChat && (
          <ChatSidebar
            messages={messages}
            typingUsers={typingUsers}
            participants={participants}
            onSendMessage={sendMessage}
            onReaction={sendReaction}
            unreadCount={unreadCount}
            onClose={() => setShowChat(false)}
          />
        )}
      </div>

      {/* Control Bar */}
      <ControlBar
        isMuted={isMuted}
        onToggleMute={() => setIsMuted(!isMuted)}
        isDeafened={isDeafened}
        onToggleDeafen={() => setIsDeafened(!isDeafened)}
        volume={volume}
        onVolumeChange={setVolume}
        isSpeaker={isSpeaker}
        handRaised={handRaised}
        onToggleHand={() => setHandRaised(!handRaised)}
        onRequestSpeak={() => {}}
        onToggleChat={() => {
          setShowChat(!showChat);
          setUnreadCount(0);
        }}
        showChat={showChat}
        unreadCount={unreadCount}
        participantCount={participants.length}
        queueCount={speakerQueue.length}
        onReaction={sendReaction}
      />

      {/* Floating Reactions */}
      <Reactions reactions={reactions} />
    </div>
  );
};

export default Room;
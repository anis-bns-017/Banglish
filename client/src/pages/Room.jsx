import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  Mic,
  MicOff,
  Headphones,
  Users,
  MessageCircle,
  Hand,
  HandMetal,
  Settings,
  LogOut,
  Copy,
  Volume2,
  UserPlus,
  Shield,
  VolumeX,
  ChevronUp,
  ChevronDown,
  MoreVertical,
  Lock,
  Globe,
} from "lucide-react";

import axios from "../utils/axios";
import { initializeSocket, getSocket, disconnectSocket } from "../utils/socket";
import Peer from "simple-peer";
import toast from "react-hot-toast";

const Room = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [participants, setParticipants] = useState([]);
  const [isMuted, setIsMuted] = useState(true);
  const [isDeafened, setIsDeafened] = useState(false);
  const [handRaised, setHandRaised] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showParticipants, setShowParticipants] = useState(true);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState("");
  const [passwordModal, setPasswordModal] = useState(false);
  const [roomPassword, setRoomPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [activeSpeakers, setActiveSpeakers] = useState(new Set());
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);
  const [showPolls, setShowPolls] = useState(false);
  const [polls, setPolls] = useState([]);
  const [speakerQueue, setSpeakerQueue] = useState([]);
  const [showRequestToSpeak, setShowRequestToSpeak] = useState(false);
  const [speakTopic, setSpeakTopic] = useState("");
  const [targetLanguage, setTargetLanguage] = useState("en");
  const [translatedMessages, setTranslatedMessages] = useState({});
  const [translationEnabled, setTranslationEnabled] = useState(false);
  const [showLanguageBar, setShowLanguageBar] = useState(false);

  // WebRTC refs
  const peersRef = useRef({});
  const streamsRef = useRef({});
  const audioContextRef = useRef(null);
  const localStreamRef = useRef(null);

  useEffect(() => {
    fetchRoom();
    initAudio();

    return () => {
      // Cleanup
      leaveRoom();
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      Object.values(peersRef.current).forEach((peer) => peer.destroy());
      disconnectSocket();
    };
  }, [roomId]);

  const fetchRoom = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/rooms/${roomId}`);
      setRoom(response.data.room);

      // Check if user is in participants
      const isParticipant = response.data.room.participants.some(
        (p) => p.user._id === user?.id,
      );

      if (!isParticipant && response.data.room.isActive) {
        // Show password modal if private
        if (response.data.room.isPrivate) {
          setPasswordModal(true);
        } else {
          joinRoom();
        }
      } else if (isParticipant) {
        // Already in room, initialize socket
        await connectSocket();
      }
    } catch (error) {
      console.error("Failed to fetch room:", error);
      toast.error("Failed to load room");
      navigate("/rooms");
    } finally {
      setLoading(false);
    }
  };

  const initAudio = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      localStreamRef.current = stream;

      // Mute by default
      stream.getAudioTracks().forEach((track) => {
        track.enabled = false;
      });

      // Create audio context for voice activity detection
      audioContextRef.current = new AudioContext();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      const analyser = audioContextRef.current.createAnalyser();
      source.connect(analyser);

      // Voice activity detection
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const checkVoiceActivity = () => {
        if (!isMuted && socketConnected) {
          analyser.getByteFrequencyData(dataArray);
          const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
          const isSpeaking = average > 20; // Threshold

          if (isSpeaking) {
            getSocket().emit("speaking", { roomId, isSpeaking: true });
          } else {
            getSocket().emit("speaking", { roomId, isSpeaking: false });
          }
        }
        requestAnimationFrame(checkVoiceActivity);
      };
      checkVoiceActivity();
    } catch (error) {
      console.error("Failed to get microphone access:", error);
      toast.error("Please allow microphone access to join voice chat");
    }
  };

  // Poll creation
  const [newPoll, setNewPoll] = useState({
    question: "",
    options: ["", ""],
    duration: 5,
  });

  // Socket listeners for new features
  useEffect(() => {
    if (!socketConnected) return;

    const socket = getSocket();

    socket.on("new-poll", (poll) => {
      setPolls((prev) => [...prev, poll]);
      toast.success("New poll created!");
    });

    socket.on("poll-update", ({ pollId, results }) => {
      setPolls((prev) =>
        prev.map((p) => (p._id === pollId ? { ...p, results } : p)),
      );
    });

    socket.on("speaker-request", ({ userId, username, topic }) => {
      if (isModerator) {
        setSpeakerQueue((prev) => [...prev, { userId, username, topic }]);
        toast(`${username} wants to speak`);
      }
    });

    socket.on("speaker-approved", ({ userId }) => {
      if (userId === user?.id) {
        toast.success("You can now speak!");
        // Update local state to allow speaking
      }
    });

    return () => {
      socket.off("new-poll");
      socket.off("poll-update");
      socket.off("speaker-request");
      socket.off("speaker-approved");
    };
  }, [socketConnected, isModerator]);

  // Translation function
  const translateMessage = async (messageId, text, targetLang) => {
    try {
      const response = await axios.post("/languages/translate", {
        text,
        targetLang,
      });

      setTranslatedMessages((prev) => ({
        ...prev,
        [messageId]: response.data.translatedText,
      }));
    } catch (error) {
      console.error("Translation failed:", error);
    }
  };

  // Handle translation toggle
  const toggleTranslation = async () => {
    setTranslationEnabled(!translationEnabled);
    if (!translationEnabled) {
      // Translate all existing messages
      const translated = {};
      for (const msg of messages) {
        translated[msg.id] = await translateMessage(
          msg.content,
          targetLanguage,
        );
      }
      setTranslatedMessages(translated);
    }
  };

  // Toggle translation for a message
  const toggleMessageTranslation = (messageId, text) => {
    if (translatedMessages[messageId]) {
      // Remove translation
      setTranslatedMessages((prev) => {
        const newPrev = { ...prev };
        delete newPrev[messageId];
        return newPrev;
      });
    } else {
      // Translate
      translateMessage(messageId, text, targetLanguage);
    }
  };

  const connectSocket = async () => {
    try {
      await initializeSocket();
      const socket = getSocket();
      setSocketConnected(true);

      // Join room
      socket.emit("join-room", { roomId });

      // Socket event listeners
      socket.on("user-joined", ({ userId, username }) => {
        toast.success(`${username} joined the room`);
        createPeer(userId);
      });

      socket.on("user-left", ({ userId, username }) => {
        toast(`${username} left the room`);
        if (peersRef.current[userId]) {
          peersRef.current[userId].destroy();
          delete peersRef.current[userId];
        }
      });

      socket.on("participants-update", (updatedParticipants) => {
        setParticipants(updatedParticipants);
      });

      socket.on("user-speaking", ({ userId, isSpeaking }) => {
        setActiveSpeakers((prev) => {
          const newSet = new Set(prev);
          if (isSpeaking) {
            newSet.add(userId);
          } else {
            newSet.delete(userId);
          }
          return newSet;
        });
      });

      socket.on("user-mic-changed", ({ userId, isMuted }) => {
        setParticipants((prev) =>
          prev.map((p) => (p.user._id === userId ? { ...p, isMuted } : p)),
        );
      });

      socket.on("hand-raised", ({ userId, raised }) => {
        setParticipants((prev) =>
          prev.map((p) =>
            p.user._id === userId ? { ...p, handRaised: raised } : p,
          ),
        );
      });

      socket.on("offer", ({ from, offer }) => {
        const peer = createPeer(from, true);
        peer.signal(offer);
      });

      socket.on("answer", ({ from, answer }) => {
        if (peersRef.current[from]) {
          peersRef.current[from].signal(answer);
        }
      });

      socket.on("ice-candidate", ({ from, candidate }) => {
        if (peersRef.current[from]) {
          peersRef.current[from].signal(candidate);
        }
      });

      // Get existing participants
      socket.emit("get-participants", roomId);
    } catch (error) {
      console.error("Socket connection failed:", error);
    }
  };

  const createPeer = (targetUserId, initiator = false) => {
    const peer = new Peer({
      initiator,
      trickle: false,
      stream: localStreamRef.current,
      config: {
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
          { urls: "stun:stun1.l.google.com:19302" },
        ],
      },
    });

    peer.on("signal", (signal) => {
      const socket = getSocket();
      if (initiator) {
        socket.emit("offer", { targetUserId, offer: signal });
      } else {
        socket.emit("answer", { targetUserId, answer: signal });
      }
    });

    peer.on("stream", (remoteStream) => {
      streamsRef.current[targetUserId] = remoteStream;
      // Add remote audio to page
      const audio = new Audio();
      audio.srcObject = remoteStream;
      audio.autoplay = true;
      audio.volume = isDeafened ? 0 : 1;
      audio.play();
    });

    peersRef.current[targetUserId] = peer;
    return peer;
  };

  const joinRoom = async (password = null) => {
    try {
      const payload = password ? { password } : {};
      const response = await axios.post(`/rooms/${roomId}/join`, payload);
      setRoom(response.data.room);
      await connectSocket();
      toast.success("Joined room successfully");
    } catch (error) {
      if (error.response?.status === 401) {
        setPasswordError("Incorrect password");
      } else {
        toast.error(error.response?.data?.message || "Failed to join room");
        navigate("/rooms");
      }
    }
  };

  const leaveRoom = async () => {
    try {
      await axios.post(`/rooms/${roomId}/leave`);
      if (socketConnected) {
        getSocket().emit("leave-room");
        disconnectSocket();
      }
      navigate("/rooms");
    } catch (error) {
      console.error("Failed to leave room:", error);
    }
  };

  const toggleMute = () => {
    if (localStreamRef.current) {
      const newMuted = !isMuted;
      localStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = !newMuted;
      });
      setIsMuted(newMuted);

      if (socketConnected) {
        getSocket().emit("toggle-mic", { roomId, isMuted: newMuted });
      }
    }
  };

  const toggleDeafen = () => {
    setIsDeafened(!isDeafened);
    Object.values(streamsRef.current).forEach((stream) => {
      // Update volume of all remote streams
    });
  };

  const toggleHandRaise = () => {
    const newHandRaised = !handRaised;
    setHandRaised(newHandRaised);
    if (socketConnected) {
      getSocket().emit("raise-hand", { roomId, raised: newHandRaised });
    }
  };

  const sendMessage = (e) => {
    e.preventDefault();
    if (messageInput.trim() && socketConnected) {
      const message = {
        id: Date.now(),
        userId: user.id,
        username: user.username,
        content: messageInput.trim(),
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, message]);
      getSocket().emit("room-message", { roomId, message });
      setMessageInput("");
    }
  };

  const copyInviteLink = () => {
    const link = `${window.location.origin}/room/${roomId}`;
    navigator.clipboard.writeText(link);
    toast.success("Invite link copied!");
  };

  // Add translation controls to chat
  const renderMessage = (msg) => (
    <div key={msg.id} className="flex flex-col">
      <div className="flex items-baseline justify-between">
        <div className="flex items-baseline space-x-2">
          <span className="font-medium text-indigo-400">{msg.username}</span>
          <span className="text-xs text-gray-500">
            {new Date(msg.timestamp).toLocaleTimeString()}
          </span>
        </div>
        {translationEnabled && (
          <button
            onClick={() => toggleMessageTranslation(msg.id, msg.content)}
            className="text-xs text-indigo-400 hover:text-indigo-300"
          >
            {translatedMessages[msg.id] ? "Show original" : "Translate"}
          </button>
        )}
      </div>
      <p className="text-sm mt-1">
        {translatedMessages[msg.id] || msg.content}
      </p>
    </div>
  );

  const handleModeration = async (targetUserId, action) => {
    try {
      await axios.post(`/rooms/${roomId}/moderate`, {
        action,
        userId: targetUserId,
      });
      toast.success(`Action performed successfully`);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to perform action");
    }
  };

  const isHost = room?.host?._id === user?.id;
  const isModerator = room?.moderators?.includes(user?.id) || isHost;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Room not found
          </h2>
          <button
            onClick={() => navigate("/rooms")}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Back to Rooms
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Password Modal */}
      {passwordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-semibold mb-4">Private Room</h2>
            <p className="text-gray-600 mb-4">
              This room is private. Please enter the password to join.
            </p>
            <input
              type="password"
              value={roomPassword}
              onChange={(e) => setRoomPassword(e.target.value)}
              placeholder="Enter room password"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-4"
              autoFocus
            />
            {passwordError && (
              <p className="text-red-600 text-sm mb-4">{passwordError}</p>
            )}
            <div className="flex justify-end gap-3">
              <button
                onClick={() => navigate("/rooms")}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => joinRoom(roomPassword)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                Join Room
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Room UI */}
      <div className="h-screen flex flex-col bg-gray-900 text-white">
        {/* Room Header */}
        <div className="bg-gray-800 border-b border-gray-700 px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-semibold">{room.name}</h1>
              {room.isPrivate ? (
                <Lock className="h-4 w-4 text-gray-400" />
              ) : (
                <Globe className="h-4 w-4 text-gray-400" />
              )}
              <span className="px-2 py-1 bg-gray-700 rounded-full text-xs">
                {room.category}
              </span>
              <span className="text-sm text-gray-400">
                {room.participantCount} participants
              </span>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={copyInviteLink}
                className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                title="Copy invite link"
              >
                <Copy className="h-5 w-5" />
              </button>
              <button
                onClick={leaveRoom}
                className="flex items-center space-x-2 px-3 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
              >
                <LogOut className="h-4 w-4" />
                <span>Leave</span>
              </button>
            </div>
          </div>
        </div>
        // Add language control to room header
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowLanguageBar(!showLanguageBar)}
            className={`p-2 rounded-lg transition-colors ${
              translationEnabled
                ? "bg-indigo-600"
                : "bg-gray-700 hover:bg-gray-600"
            }`}
            title="Language tools"
          >
            <Globe className="h-5 w-5" />
          </button>

          {showLanguageBar && (
            <div className="absolute top-16 right-6 bg-gray-800 rounded-lg shadow-xl p-4 z-20">
              <h3 className="text-sm font-medium mb-3">Translation Settings</h3>
              <div className="space-y-3">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={translationEnabled}
                    onChange={(e) => setTranslationEnabled(e.target.checked)}
                    className="rounded text-indigo-600"
                  />
                  <span className="text-sm">Enable translations</span>
                </label>

                {translationEnabled && (
                  <select
                    value={targetLanguage}
                    onChange={(e) => setTargetLanguage(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-700 rounded-lg text-sm"
                  >
                    <option value="en">English</option>
                    <option value="es">Spanish</option>
                    <option value="fr">French</option>
                    <option value="de">German</option>
                    <option value="zh">Chinese</option>
                    <option value="ja">Japanese</option>
                    <option value="ko">Korean</option>
                  </select>
                )}
              </div>
            </div>
          )}
        </div>
        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Participants Grid */}
          <div
            className={`flex-1 p-6 overflow-y-auto ${showChat ? "w-2/3" : "w-full"}`}
          >
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {participants.map((participant) => (
                <div
                  key={participant.user._id}
                  className="relative bg-gray-800 rounded-lg p-4 aspect-video flex flex-col items-center justify-center"
                >
                  {/* Speaking indicator */}
                  {activeSpeakers.has(participant.user._id) && (
                    <div className="absolute inset-0 rounded-lg ring-4 ring-green-500 animate-pulse"></div>
                  )}

                  {/* User avatar/icon */}
                  <div className="relative">
                    {participant.user.avatar ? (
                      <img
                        src={participant.user.avatar}
                        alt={participant.user.username}
                        className="w-16 h-16 rounded-full"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-indigo-600 flex items-center justify-center text-2xl font-bold">
                        {participant.user.username?.charAt(0).toUpperCase()}
                      </div>
                    )}

                    {/* Role badge */}
                    {participant.role !== "listener" && (
                      <div className="absolute -bottom-1 -right-1 bg-indigo-500 rounded-full p-1">
                        {participant.role === "host" && (
                          <Shield className="h-3 w-3" />
                        )}
                        {participant.role === "moderator" && (
                          <Shield className="h-3 w-3" />
                        )}
                        {participant.role === "speaker" && (
                          <Volume2 className="h-3 w-3" />
                        )}
                      </div>
                    )}

                    {/* Hand raised indicator */}
                    {participant.handRaised && (
                      <div className="absolute -top-2 -left-2 bg-yellow-500 rounded-full p-1 animate-bounce">
                        <Hand className="h-4 w-4" />
                      </div>
                    )}
                  </div>

                  {/* User info */}
                  <div className="mt-3 text-center">
                    <p className="font-medium">
                      {participant.user.username}
                      {participant.user._id === user?.id && " (You)"}
                    </p>
                    <div className="flex items-center justify-center space-x-2 mt-1">
                      {/* Mic status */}
                      {participant.isMuted ? (
                        <MicOff className="h-4 w-4 text-red-500" />
                      ) : (
                        <Mic className="h-4 w-4 text-green-500" />
                      )}

                      {/* Moderation menu (for hosts/moderators) */}
                      {isModerator && participant.user._id !== user?.id && (
                        <div className="relative">
                          <button
                            onClick={() =>
                              setSelectedUser(
                                selectedUser === participant.user._id
                                  ? null
                                  : participant.user._id,
                              )
                            }
                            className="p-1 hover:bg-gray-700 rounded"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </button>

                          {selectedUser === participant.user._id && (
                            <div className="absolute bottom-full mb-2 left-0 bg-gray-700 rounded-lg shadow-lg py-2 w-48 z-10">
                              <button
                                onClick={() => {
                                  handleModeration(
                                    participant.user._id,
                                    participant.isMuted ? "unmute" : "mute",
                                  );
                                  setSelectedUser(null);
                                }}
                                className="w-full px-4 py-2 text-left hover:bg-gray-600 text-sm"
                              >
                                {participant.isMuted ? "Unmute" : "Mute"}
                              </button>
                              <button
                                onClick={() => {
                                  handleModeration(
                                    participant.user._id,
                                    participant.role === "speaker"
                                      ? "make-listener"
                                      : "make-speaker",
                                  );
                                  setSelectedUser(null);
                                }}
                                className="w-full px-4 py-2 text-left hover:bg-gray-600 text-sm"
                              >
                                {participant.role === "speaker"
                                  ? "Make Listener"
                                  : "Make Speaker"}
                              </button>
                              {isHost && (
                                <>
                                  <button
                                    onClick={() => {
                                      handleModeration(
                                        participant.user._id,
                                        "make-moderator",
                                      );
                                      setSelectedUser(null);
                                    }}
                                    className="w-full px-4 py-2 text-left hover:bg-gray-600 text-sm"
                                  >
                                    Make Moderator
                                  </button>
                                  <button
                                    onClick={() => {
                                      handleModeration(
                                        participant.user._id,
                                        "remove",
                                      );
                                      setSelectedUser(null);
                                    }}
                                    className="w-full px-4 py-2 text-left hover:bg-gray-600 text-sm text-red-400"
                                  >
                                    Remove from Room
                                  </button>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Chat Sidebar */}
          {showChat && (
            <div className="w-1/3 bg-gray-800 border-l border-gray-700 flex flex-col">
              <div className="p-4 border-b border-gray-700">
                <h3 className="font-semibold">Chat</h3>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg) => (
                  <div key={msg.id} className="flex flex-col">
                    <div className="flex items-baseline space-x-2">
                      <span className="font-medium text-indigo-400">
                        {msg.username}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(msg.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-sm mt-1">{msg.content}</p>
                  </div>
                ))}
              </div>

              <form
                onSubmit={sendMessage}
                className="p-4 border-t border-gray-700"
              >
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 px-3 py-2 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    Send
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
        {/* Control Bar */}
        <div className="bg-gray-800 border-t border-gray-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {/* Mic control */}
              <button
                onClick={toggleMute}
                className={`p-3 rounded-lg transition-colors ${
                  isMuted
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-gray-700 hover:bg-gray-600"
                }`}
                title={isMuted ? "Unmute" : "Mute"}
              >
                {isMuted ? (
                  <MicOff className="h-5 w-5" />
                ) : (
                  <Mic className="h-5 w-5" />
                )}
              </button>

              {/* Deafen control */}
              <button
                onClick={toggleDeafen}
                className={`p-3 rounded-lg transition-colors ${
                  isDeafened
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-gray-700 hover:bg-gray-600"
                }`}
                title={isDeafened ? "Undeafen" : "Deafen"}
              >
                {isDeafened ? (
                  <VolumeX className="h-5 w-5" />
                ) : (
                  <Headphones className="h-5 w-5" />
                )}
              </button>

              {/* Raise hand */}
              <button
                onClick={toggleHandRaise}
                className={`p-3 rounded-lg transition-colors ${
                  handRaised
                    ? "bg-yellow-600 hover:bg-yellow-700"
                    : "bg-gray-700 hover:bg-gray-600"
                }`}
                title={handRaised ? "Lower hand" : "Raise hand"}
              >
                <Hand className="h-5 w-5" />
              </button>

              {/* Participants list toggle */}
              <button
                onClick={() => setShowParticipants(!showParticipants)}
                className="p-3 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors relative"
                title="Toggle participants list"
              >
                <Users className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 bg-indigo-600 text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {participants.length}
                </span>
              </button>

              {/* Chat toggle */}
              <button
                onClick={() => setShowChat(!showChat)}
                className={`p-3 rounded-lg transition-colors ${
                  showChat
                    ? "bg-indigo-600 hover:bg-indigo-700"
                    : "bg-gray-700 hover:bg-gray-600"
                }`}
                title="Toggle chat"
              >
                <MessageCircle className="h-5 w-5" />
              </button>
            </div>

            {/* Room info */}
            <div className="flex items-center space-x-4 text-sm text-gray-400">
              <span>🔊 {activeSpeakers.size} speaking</span>
              <span>
                ✋ {participants.filter((p) => p.handRaised).length} hands
                raised
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Room;

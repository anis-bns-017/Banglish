import React, { useRef, useEffect, useState } from 'react';
import { X, Smile } from 'lucide-react';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import EmojiPicker from 'emoji-picker-react';

const ChatSidebar = ({
  messages,
  typingUsers,
  participants,
  onSendMessage,
  onReaction,
  unreadCount,
  onClose
}) => {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const getTypingText = () => {
    if (typingUsers.length === 0) return '';
    
    const names = typingUsers.map(userId => {
      const participant = participants.find(p => p.user._id === userId);
      return participant?.user?.username || 'Someone';
    });

    if (names.length === 1) return `${names[0]} is typing...`;
    if (names.length === 2) return `${names[0]} and ${names[1]} are typing...`;
    return `${names.length} people are typing...`;
  };

  return (
    <div className="w-1/3 bg-gray-800/50 backdrop-blur-sm border-l border-gray-700 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-700 flex items-center justify-between">
        <h3 className="font-semibold flex items-center">
          Chat
          {unreadCount > 0 && (
            <span className="ml-2 px-2 py-0.5 bg-indigo-600 text-xs rounded-full">
              {unreadCount} new
            </span>
          )}
        </h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Messages */}
      <MessageList messages={messages} participants={participants} />

      {/* Typing Indicator */}
      {typingUsers.length > 0 && (
        <div className="px-4 py-2 text-sm text-gray-400 italic">
          {getTypingText()}
        </div>
      )}

      {/* Emoji Picker */}
      {showEmojiPicker && (
        <div className="absolute bottom-20 right-4 z-10">
          <EmojiPicker
            onEmojiClick={(emojiData) => {
              onReaction(emojiData.emoji);
              setShowEmojiPicker(false);
            }}
          />
        </div>
      )}

      {/* Input */}
      <MessageInput
        onSendMessage={onSendMessage}
        onEmojiClick={() => setShowEmojiPicker(!showEmojiPicker)}
      />

      <div ref={messagesEndRef} />
    </div>
  );
};

export default ChatSidebar;
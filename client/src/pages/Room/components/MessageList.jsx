import React from 'react';

const MessageList = ({ messages, participants }) => {
  const getUserInfo = (userId) => {
    return participants.find(p => p.user._id === userId)?.user;
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.map((msg) => {
        const user = getUserInfo(msg.userId);
        
        return (
          <div key={msg.id} className="flex items-start space-x-2">
            {/* Avatar */}
            {user?.avatar ? (
              <img 
                src={user.avatar} 
                alt="" 
                className="w-8 h-8 rounded-full object-cover"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-sm font-medium">
                {user?.username?.charAt(0).toUpperCase() || '?'}
              </div>
            )}

            {/* Message Content */}
            <div className="flex-1">
              <div className="flex items-baseline space-x-2">
                <span className="font-medium text-indigo-400">
                  {user?.fullName || user?.username || 'Unknown'}
                </span>
                <span className="text-xs text-gray-500">
                  {formatTime(msg.timestamp)}
                </span>
              </div>
              <p className="text-sm mt-1">{msg.content}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default MessageList;
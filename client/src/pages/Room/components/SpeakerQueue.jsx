import React from 'react';
import { Hand, Check, X } from 'lucide-react';

const SpeakerQueue = ({ queue, onApprove, onReject }) => {
  return (
    <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-4 mb-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center">
          <Hand className="h-5 w-5 text-yellow-400 mr-2" />
          <span className="font-medium">Speaker Requests ({queue.length})</span>
        </div>
      </div>
      
      <div className="space-y-2 max-h-60 overflow-y-auto">
        {queue.map((item, index) => (
          <div 
            key={item.userId} 
            className="flex items-center justify-between bg-gray-800/50 rounded-lg p-2"
          >
            <div className="flex items-center">
              <span className="text-sm text-gray-400 mr-2">{index + 1}.</span>
              <div>
                <p className="font-medium">{item.username}</p>
                {item.topic && (
                  <p className="text-xs text-gray-400">Topic: {item.topic}</p>
                )}
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => onApprove(item.userId)}
                className="p-1 bg-green-600 rounded hover:bg-green-700 transition-colors"
                title="Approve"
              >
                <Check className="h-4 w-4" />
              </button>
              <button
                onClick={() => onReject(item.userId)}
                className="p-1 bg-red-600 rounded hover:bg-red-700 transition-colors"
                title="Reject"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SpeakerQueue;
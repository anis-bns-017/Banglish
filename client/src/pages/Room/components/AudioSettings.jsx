import React from 'react';
import { X, Volume2, Mic, Headphones } from 'lucide-react';

const AudioSettings = ({
  devices,
  selectedDevice,
  onChangeDevice,
  volume,
  onVolumeChange,
  onClose
}) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg shadow-xl w-96">
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h3 className="font-semibold">Audio Settings</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Input Device */}
          <div>
            <label className="flex items-center text-sm text-gray-400 mb-2">
              <Mic className="h-4 w-4 mr-2" />
              Microphone
            </label>
            <select
              value={selectedDevice}
              onChange={(e) => onChangeDevice(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 rounded-lg text-sm"
            >
              {devices.map(device => (
                <option key={device.deviceId} value={device.deviceId}>
                  {device.label || `Microphone ${device.deviceId.slice(0, 5)}`}
                </option>
              ))}
            </select>
          </div>

          {/* Volume */}
          <div>
            <label className="flex items-center text-sm text-gray-400 mb-2">
              <Headphones className="h-4 w-4 mr-2" />
              Output Volume
            </label>
            <div className="flex items-center space-x-2">
              <Volume2 className="h-4 w-4 text-gray-400" />
              <input
                type="range"
                min="0"
                max="100"
                value={volume}
                onChange={(e) => onVolumeChange(parseInt(e.target.value))}
                className="flex-1"
              />
              <span className="text-sm w-12">{volume}%</span>
            </div>
          </div>

          {/* Voice Activity */}
          <div className="pt-4 border-t border-gray-700">
            <h4 className="text-sm font-medium mb-2">Voice Activity</h4>
            <div className="bg-gray-700 h-8 rounded-lg relative overflow-hidden">
              <div 
                className="absolute inset-y-0 left-0 bg-green-500 transition-all duration-100"
                style={{ width: '30%' }}
              ></div>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Speaking threshold • Adjust in advanced settings
            </p>
          </div>
        </div>

        <div className="p-4 border-t border-gray-700">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default AudioSettings;
import React from 'react';
import { WifiOff, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';

const Offline = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <WifiOff className="h-10 w-10 text-red-600" />
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            You're Offline
          </h1>
          
          <p className="text-gray-600 mb-6">
            Don't worry! You can still access your profile and settings.
            Connect to the internet to join voice rooms.
          </p>

          <div className="space-y-3">
            <Link
              to="/profile"
              className="block w-full px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              View Profile
            </Link>
            
            <Link
              to="/settings"
              className="block w-full px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              App Settings
            </Link>

            <button
              onClick={() => window.location.reload()}
              className="flex items-center justify-center w-full px-4 py-3 text-indigo-600 hover:text-indigo-700 transition-colors"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Reconnecting
            </button>
          </div>

          {/* Cached Rooms Preview */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <h3 className="text-sm font-medium text-gray-700 mb-3">
              Available Offline
            </h3>
            <div className="space-y-2">
              <div className="flex items-center p-2 bg-gray-50 rounded-lg">
                <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                  <span className="text-xs font-medium text-indigo-600">📚</span>
                </div>
                <div className="ml-3 text-left">
                  <p className="text-sm font-medium text-gray-900">Language Exchange</p>
                  <p className="text-xs text-gray-500">Cached for offline</p>
                </div>
              </div>
              <div className="flex items-center p-2 bg-gray-50 rounded-lg">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <span className="text-xs font-medium text-purple-600">🎵</span>
                </div>
                <div className="ml-3 text-left">
                  <p className="text-sm font-medium text-gray-900">Music Producers</p>
                  <p className="text-xs text-gray-500">Cached for offline</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Offline;
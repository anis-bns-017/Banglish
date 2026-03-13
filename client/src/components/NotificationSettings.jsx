import React, { useState, useEffect } from 'react';
import { Bell, BellOff, Clock, Volume2, VolumeX } from 'lucide-react';
import { isPushSupported, subscribeToPush, unsubscribeFromPush, getSubscription } from '../utils/pushNotifications';
import axios from '../utils/axios';
import toast from 'react-hot-toast';

const NotificationSettings = () => {
  const [permission, setPermission] = useState(Notification?.permission || 'default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [preferences, setPreferences] = useState({
    newFollowers: true,
    roomReminders: true,
    friendActivity: true,
    recommendations: true,
    eventReminders: true,
    quietHours: {
      enabled: false,
      start: '22:00',
      end: '08:00'
    }
  });

  useEffect(() => {
    checkSubscription();
    fetchPreferences();
  }, []);

  const checkSubscription = async () => {
    if (!isPushSupported()) return;
    
    const subscription = await getSubscription();
    setIsSubscribed(!!subscription);
  };

  const fetchPreferences = async () => {
    try {
      const response = await axios.get('/users/notification-preferences');
      setPreferences(response.data.preferences);
    } catch (error) {
      console.error('Failed to fetch preferences:', error);
    }
  };

  const requestPermission = async () => {
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      
      if (result === 'granted') {
        const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;
        const subscription = await subscribeToPush(VAPID_PUBLIC_KEY);
        
        // Send subscription to server
        await axios.post('/users/push-subscription', subscription);
        setIsSubscribed(true);
        toast.success('Notifications enabled');
      }
    } catch (error) {
      toast.error('Failed to enable notifications');
    }
  };

  const toggleSubscription = async () => {
    setLoading(true);
    try {
      if (isSubscribed) {
        await unsubscribeFromPush();
        await axios.delete('/users/push-subscription');
        setIsSubscribed(false);
        toast.success('Notifications disabled');
      } else {
        const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;
        const subscription = await subscribeToPush(VAPID_PUBLIC_KEY);
        await axios.post('/users/push-subscription', subscription);
        setIsSubscribed(true);
        toast.success('Notifications enabled');
      }
    } catch (error) {
      toast.error('Operation failed');
    } finally {
      setLoading(false);
    }
  };

  const updatePreference = async (key, value) => {
    try {
      const newPreferences = { ...preferences, [key]: value };
      setPreferences(newPreferences);
      await axios.put('/users/notification-preferences', newPreferences);
    } catch (error) {
      toast.error('Failed to update preference');
    }
  };

  if (!isPushSupported()) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-yellow-800 text-sm">
          Push notifications are not supported in your browser.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Permission Status */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium">Push Notifications</h3>
          {permission === 'granted' ? (
            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
              Enabled
            </span>
          ) : (
            <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">
              Disabled
            </span>
          )}
        </div>

        {permission === 'default' && (
          <button
            onClick={requestPermission}
            className="w-full px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center justify-center"
          >
            <Bell className="h-5 w-5 mr-2" />
            Enable Notifications
          </button>
        )}

        {permission === 'denied' && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800 text-sm">
              Notifications are blocked. Please enable them in your browser settings.
            </p>
          </div>
        )}

        {permission === 'granted' && (
          <button
            onClick={toggleSubscription}
            disabled={loading}
            className={`w-full px-4 py-3 rounded-lg flex items-center justify-center ${
              isSubscribed 
                ? 'bg-red-600 text-white hover:bg-red-700' 
                : 'bg-indigo-600 text-white hover:bg-indigo-700'
            } disabled:opacity-50`}
          >
            {isSubscribed ? (
              <>
                <BellOff className="h-5 w-5 mr-2" />
                Disable Notifications
              </>
            ) : (
              <>
                <Bell className="h-5 w-5 mr-2" />
                Enable Notifications
              </>
            )}
          </button>
        )}
      </div>

      {/* Notification Preferences */}
      {permission === 'granted' && isSubscribed && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium mb-4">Notification Preferences</h3>
          
          <div className="space-y-3">
            <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium">New Followers</p>
                <p className="text-xs text-gray-500">When someone follows you</p>
              </div>
              <input
                type="checkbox"
                checked={preferences.newFollowers}
                onChange={(e) => updatePreference('newFollowers', e.target.checked)}
                className="toggle"
              />
            </label>

            <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium">Room Reminders</p>
                <p className="text-xs text-gray-500">Before rooms you're interested in start</p>
              </div>
              <input
                type="checkbox"
                checked={preferences.roomReminders}
                onChange={(e) => updatePreference('roomReminders', e.target.checked)}
                className="toggle"
              />
            </label>

            <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium">Friend Activity</p>
                <p className="text-xs text-gray-500">When friends join rooms</p>
              </div>
              <input
                type="checkbox"
                checked={preferences.friendActivity}
                onChange={(e) => updatePreference('friendActivity', e.target.checked)}
                className="toggle"
              />
            </label>

            <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium">Recommendations</p>
                <p className="text-xs text-gray-500">Personalized room suggestions</p>
              </div>
              <input
                type="checkbox"
                checked={preferences.recommendations}
                onChange={(e) => updatePreference('recommendations', e.target.checked)}
                className="toggle"
              />
            </label>

            <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium">Event Reminders</p>
                <p className="text-xs text-gray-500">For clubs and scheduled events</p>
              </div>
              <input
                type="checkbox"
                checked={preferences.eventReminders}
                onChange={(e) => updatePreference('eventReminders', e.target.checked)}
                className="toggle"
              />
            </label>
          </div>

          {/* Quiet Hours */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <label className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <Clock className="h-5 w-5 text-gray-400 mr-2" />
                <span className="font-medium">Quiet Hours</span>
              </div>
              <input
                type="checkbox"
                checked={preferences.quietHours.enabled}
                onChange={(e) => updatePreference('quietHours', {
                  ...preferences.quietHours,
                  enabled: e.target.checked
                })}
                className="toggle"
              />
            </label>

            {preferences.quietHours.enabled && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Start Time</label>
                  <input
                    type="time"
                    value={preferences.quietHours.start}
                    onChange={(e) => updatePreference('quietHours', {
                      ...preferences.quietHours,
                      start: e.target.value
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">End Time</label>
                  <input
                    type="time"
                    value={preferences.quietHours.end}
                    onChange={(e) => updatePreference('quietHours', {
                      ...preferences.quietHours,
                      end: e.target.value
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationSettings;
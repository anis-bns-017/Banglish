import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  TrendingUp, Users, Clock, Sparkles, 
  ChevronRight, Mic, Globe, Lock 
} from 'lucide-react';
import axios from '../utils/axios';

const Recommendations = () => {
  const [recommendations, setRecommendations] = useState([]);
  const [trending, setTrending] = useState({ categories: [], topics: [] });
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAllRecommendations();
  }, []);

  const fetchAllRecommendations = async () => {
    try {
      const [recRes, trendRes, notifRes] = await Promise.all([
        axios.get('/recommendations/rooms'),
        axios.get('/recommendations/trending'),
        axios.get('/recommendations/notifications')
      ]);
      
      setRecommendations(recRes.data.recommendations);
      setTrending(trendRes.data);
      setNotifications(notifRes.data.notifications);
    } catch (error) {
      console.error('Failed to fetch recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRoomClick = async (roomId) => {
    try {
      await axios.post('/recommendations/update-interests', {
        roomId,
        action: 'click'
      });
    } catch (error) {
      console.error('Failed to update interests:', error);
    }
  };

  const getCategoryColor = (category) => {
    const colors = {
      language: 'bg-green-100 text-green-800',
      music: 'bg-purple-100 text-purple-800',
      gaming: 'bg-red-100 text-red-800',
      tech: 'bg-blue-100 text-blue-800',
      social: 'bg-yellow-100 text-yellow-800',
      education: 'bg-indigo-100 text-indigo-800',
      other: 'bg-gray-100 text-gray-800'
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Smart Notifications */}
      {notifications.length > 0 && (
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-4">
          <h3 className="text-sm font-medium text-indigo-900 mb-3 flex items-center">
            <Sparkles className="h-4 w-4 mr-2" />
            For You
          </h3>
          <div className="space-y-2">
            {notifications.map((notif, index) => (
              <Link
                key={index}
                to={`/room/${notif.roomId}`}
                onClick={() => handleRoomClick(notif.roomId)}
                className="block p-3 bg-white rounded-lg hover:shadow-md transition-shadow"
              >
                <div className="flex items-start">
                  <div className={`px-2 py-1 rounded-full text-xs ${
                    notif.priority === 'high' ? 'bg-red-100 text-red-800' :
                    notif.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {notif.type === 'upcoming_room' && '🔔'}
                    {notif.type === 'trending' && '🔥'}
                    {notif.type === 'language' && '🗣️'}
                  </div>
                  <div className="ml-3 flex-1">
                    <p className="text-sm font-medium text-gray-900">{notif.title}</p>
                    <p className="text-xs text-gray-500">{notif.message}</p>
                  </div>
                  {notif.time && (
                    <span className="text-xs text-gray-400">
                      {new Date(notif.time).toLocaleTimeString()}
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Trending Topics */}
      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
          <TrendingUp className="h-4 w-4 mr-2 text-indigo-600" />
          Trending Now
        </h3>
        <div className="flex flex-wrap gap-2">
          {trending.trendingCategories?.map((cat) => (
            <Link
              key={cat.name}
              to={`/rooms?category=${cat.name}`}
              className={`px-3 py-1 rounded-full text-sm ${getCategoryColor(cat.name)}`}
            >
              {cat.name} ({cat.count})
            </Link>
          ))}
          {trending.trendingTopics?.map((topic) => (
            <Link
              key={topic.name}
              to={`/rooms?search=${topic.name}`}
              className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-gray-200"
            >
              #{topic.name} ({topic.count})
            </Link>
          ))}
        </div>
      </div>

      {/* Personalized Recommendations */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-gray-700">Recommended for You</h3>
          <Link to="/rooms?filter=recommended" className="text-xs text-indigo-600 hover:text-indigo-500">
            View All
            <ChevronRight className="h-3 w-3 inline ml-1" />
          </Link>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {recommendations.slice(0, 3).map((room) => (
            <Link
              key={room._id}
              to={`/room/${room._id}`}
              onClick={() => handleRoomClick(room._id)}
              className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-4 border border-gray-100"
            >
              <div className="flex justify-between items-start mb-2">
                <span className={`px-2 py-1 rounded-full text-xs ${getCategoryColor(room.category)}`}>
                  {room.category}
                </span>
                {room.isPrivate ? (
                  <Lock className="h-3 w-3 text-gray-400" />
                ) : (
                  <Globe className="h-3 w-3 text-gray-400" />
                )}
              </div>
              
              <h4 className="font-medium text-gray-900 mb-1">{room.name}</h4>
              
              {room.description && (
                <p className="text-xs text-gray-500 mb-2 line-clamp-2">{room.description}</p>
              )}
              
              <div className="flex items-center justify-between text-xs text-gray-500">
                <div className="flex items-center">
                  <Users className="h-3 w-3 mr-1" />
                  <span>{room.participantCount}</span>
                </div>
                
                {room.host && (
                  <div className="flex items-center">
                    {room.host.avatar ? (
                      <img src={room.host.avatar} alt="" className="h-4 w-4 rounded-full mr-1" />
                    ) : (
                      <div className="h-4 w-4 rounded-full bg-indigo-100 flex items-center justify-center mr-1">
                        <span className="text-[8px] font-medium text-indigo-600">
                          {room.host.username?.charAt(0)}
                        </span>
                      </div>
                    )}
                    <span className="truncate max-w-[60px]">{room.host.username}</span>
                  </div>
                )}
              </div>

              {/* Match indicator */}
              <div className="mt-2 pt-2 border-t border-gray-100">
                <div className="flex items-center text-xs text-green-600">
                  <Sparkles className="h-3 w-3 mr-1" />
                  <span>Matches your interests</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Recommendations;
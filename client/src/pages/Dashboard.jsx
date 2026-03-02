import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { 
  LogOut, User, Mail, Calendar, Users, 
  MessageCircle, Mic, PlusCircle, TrendingUp,
  Clock, Globe, Lock, ChevronRight 
} from 'lucide-react';
import axios from '../utils/axios';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const [recentRooms, setRecentRooms] = useState([]);
  const [popularRooms, setPopularRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      setLoading(true);
      // Fetch recent active rooms
      const response = await axios.get('/rooms?limit=4&sort=-createdAt');
      setRecentRooms(response.data.rooms);
      
      // Fetch popular rooms (by participant count)
      const popularResponse = await axios.get('/rooms?limit=4&sort=-participantCount');
      setPopularRooms(popularResponse.data.rooms);
    } catch (error) {
      console.error('Failed to fetch rooms:', error);
    } finally {
      setLoading(false);
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link to="/dashboard" className="flex items-center">
                <div className="h-8 w-8 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-center">
                  <span className="text-white text-sm font-bold">H</span>
                </div>
                <span className="ml-2 text-xl font-semibold text-gray-900">Hilokal Clone</span>
              </Link>
            </div>
            
            <div className="flex items-center space-x-4">
              <Link
                to="/rooms"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
              >
                <Users className="h-4 w-4 mr-2" />
                Browse Rooms
              </Link>
              
              <Link
                to="/profile"
                className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium"
              >
                Profile
              </Link>
              
              <button
                onClick={logout}
                className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {user?.fullName || user?.username}!
          </h1>
          <p className="mt-2 text-gray-600">
            Join a voice conversation or create your own room
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Link
            to="/rooms"
            className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow p-6 border border-gray-200 hover:border-indigo-300"
          >
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-indigo-100 rounded-lg p-3">
                <Users className="h-6 w-6 text-indigo-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Browse Rooms</h3>
                <p className="text-sm text-gray-500">Find conversations to join</p>
              </div>
              <ChevronRight className="ml-auto h-5 w-5 text-gray-400" />
            </div>
          </Link>

          <Link
            to="/rooms?create=true"
            className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow p-6 border border-gray-200 hover:border-indigo-300"
          >
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-green-100 rounded-lg p-3">
                <PlusCircle className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Create Room</h3>
                <p className="text-sm text-gray-500">Start your own voice chat</p>
              </div>
              <ChevronRight className="ml-auto h-5 w-5 text-gray-400" />
            </div>
          </Link>

          <Link
            to="/profile"
            className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow p-6 border border-gray-200 hover:border-indigo-300"
          >
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-purple-100 rounded-lg p-3">
                <User className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Your Profile</h3>
                <p className="text-sm text-gray-500">Manage your account</p>
              </div>
              <ChevronRight className="ml-auto h-5 w-5 text-gray-400" />
            </div>
          </Link>
        </div>

        {/* User Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <User className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Username</dt>
                    <dd className="text-lg font-medium text-gray-900">@{user?.username}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Mail className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Email</dt>
                    <dd className="text-lg font-medium text-gray-900">{user?.email}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Calendar className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Member since</dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <TrendingUp className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Role</dt>
                    <dd className="text-lg font-medium">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user?.role === 'admin' 
                          ? 'bg-purple-100 text-purple-800' 
                          : user?.role === 'moderator'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {user?.role || 'user'}
                      </span>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Rooms Section */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Recent Active Rooms</h2>
            <Link to="/rooms" className="text-sm text-indigo-600 hover:text-indigo-500 flex items-center">
              View all <ChevronRight className="h-4 w-4 ml-1" />
            </Link>
          </div>

          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {recentRooms.map((room) => (
                <Link
                  key={room._id}
                  to={`/room/${room._id}`}
                  className="bg-white rounded-lg shadow hover:shadow-md transition-shadow overflow-hidden border border-gray-200"
                >
                  <div className="p-5">
                    <div className="flex justify-between items-start mb-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(room.category)}`}>
                        {room.category}
                      </span>
                      {room.isPrivate ? (
                        <Lock className="h-4 w-4 text-gray-400" />
                      ) : (
                        <Globe className="h-4 w-4 text-gray-400" />
                      )}
                    </div>
                    
                    <h3 className="font-semibold text-gray-900 mb-2 truncate">{room.name}</h3>
                    
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {room.description || 'No description'}
                    </p>
                    
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center text-gray-500">
                        <Users className="h-4 w-4 mr-1" />
                        <span>{room.participantCount}/{room.maxParticipants}</span>
                      </div>
                      <div className="flex items-center text-gray-500">
                        <Mic className="h-4 w-4 mr-1" />
                        <span>{room.participants?.filter(p => !p.isMuted).length || 0}</span>
                      </div>
                    </div>

                    {room.host && (
                      <div className="mt-3 pt-3 border-t border-gray-100 flex items-center">
                        {room.host.avatar ? (
                          <img src={room.host.avatar} alt="" className="h-5 w-5 rounded-full" />
                        ) : (
                          <div className="h-5 w-5 rounded-full bg-indigo-100 flex items-center justify-center">
                            <span className="text-xs font-medium text-indigo-600">
                              {room.host.username?.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                        <span className="ml-2 text-xs text-gray-500 truncate">
                          {room.host.username}
                        </span>
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Popular Rooms Section */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">🔥 Popular Now</h2>
            <Link to="/rooms?sort=popular" className="text-sm text-indigo-600 hover:text-indigo-500 flex items-center">
              View all <ChevronRight className="h-4 w-4 ml-1" />
            </Link>
          </div>

          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {popularRooms.map((room) => (
                <Link
                  key={room._id}
                  to={`/room/${room._id}`}
                  className="bg-white rounded-lg shadow hover:shadow-md transition-shadow overflow-hidden border border-gray-200"
                >
                  <div className="p-5">
                    <div className="flex justify-between items-start mb-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(room.category)}`}>
                        {room.category}
                      </span>
                      <div className="flex items-center text-green-600">
                        <Users className="h-4 w-4 mr-1" />
                        <span className="text-xs font-medium">{room.participantCount}</span>
                      </div>
                    </div>
                    
                    <h3 className="font-semibold text-gray-900 mb-2 truncate">{room.name}</h3>
                    
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {room.description || 'No description'}
                    </p>
                    
                    <div className="flex items-center text-sm text-gray-500">
                      <Clock className="h-4 w-4 mr-1" />
                      <span>Started {new Date(room.createdAt).toLocaleTimeString()}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Call to Action */}
        {(!recentRooms.length && !popularRooms.length) && (
          <div className="text-center py-12">
            <MessageCircle className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No rooms yet</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by creating a new room.</p>
            <div className="mt-6">
              <Link
                to="/rooms?create=true"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
              >
                <PlusCircle className="h-5 w-5 mr-2" />
                Create Room
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
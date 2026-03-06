import React, { useState, useEffect } from 'react';
import { Trophy, Medal, Award, TrendingUp, Users, Clock } from 'lucide-react';
import axios from '../utils/axios';
import { Link } from 'react-router-dom';

const Leaderboards = () => {
  const [activeTab, setActiveTab] = useState('xp');
  const [timeframe, setTimeframe] = useState('all');
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboards();
  }, [activeTab, timeframe]);

  const fetchLeaderboards = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/users/leaderboards?type=${activeTab}&timeframe=${timeframe}`);
      setLeaders(response.data.leaders);
    } catch (error) {
      console.error('Failed to fetch leaderboards:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMedalColor = (index) => {
    switch(index) {
      case 0: return 'text-yellow-500';
      case 1: return 'text-gray-400';
      case 2: return 'text-amber-600';
      default: return 'text-gray-300';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <Trophy className="h-6 w-6 mr-2 text-yellow-500" />
            Leaderboards
          </h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="flex space-x-1 border-b border-gray-200 mb-6">
          <button
            onClick={() => setActiveTab('xp')}
            className={`px-4 py-2 text-sm font-medium ${
              activeTab === 'xp'
                ? 'border-b-2 border-indigo-500 text-indigo-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <TrendingUp className="h-4 w-4 inline mr-2" />
            Top XP
          </button>
          <button
            onClick={() => setActiveTab('rooms')}
            className={`px-4 py-2 text-sm font-medium ${
              activeTab === 'rooms'
                ? 'border-b-2 border-indigo-500 text-indigo-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Users className="h-4 w-4 inline mr-2" />
            Most Rooms Hosted
          </button>
          <button
            onClick={() => setActiveTab('time')}
            className={`px-4 py-2 text-sm font-medium ${
              activeTab === 'time'
                ? 'border-b-2 border-indigo-500 text-indigo-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Clock className="h-4 w-4 inline mr-2" />
            Speaking Time
          </button>
        </div>

        {/* Timeframe Filter */}
        <div className="flex justify-end mb-6">
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="all">All Time</option>
            <option value="month">This Month</option>
            <option value="week">This Week</option>
            <option value="today">Today</option>
          </select>
        </div>

        {/* Leaderboard List */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : (
          <div className="bg-white shadow rounded-lg overflow-hidden">
            {leaders.map((user, index) => (
              <Link
                key={user._id}
                to={`/profile/${user._id}`}
                className="flex items-center p-4 hover:bg-gray-50 border-b last:border-b-0 transition-colors"
              >
                {/* Rank */}
                <div className="w-12 text-center">
                  {index < 3 ? (
                    <Medal className={`h-6 w-6 mx-auto ${getMedalColor(index)}`} />
                  ) : (
                    <span className="text-lg font-medium text-gray-500">#{index + 1}</span>
                  )}
                </div>

                {/* Avatar */}
                <div className="ml-4">
                  {user.avatar ? (
                    <img src={user.avatar} alt="" className="h-10 w-10 rounded-full" />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                      <span className="text-sm font-medium text-indigo-600">
                        {user.username?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>

                {/* User Info */}
                <div className="ml-4 flex-1">
                  <div className="flex items-center">
                    <p className="font-medium text-gray-900">{user.fullName || user.username}</p>
                    {user.isCreator && (
                      <span className="ml-2 px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                        Creator
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500">@{user.username}</p>
                </div>

                {/* Stats */}
                <div className="text-right">
                  {activeTab === 'xp' && (
                    <>
                      <p className="font-bold text-indigo-600">{user.xp?.toLocaleString()} XP</p>
                      <p className="text-xs text-gray-500">Level {user.level || 1}</p>
                    </>
                  )}
                  {activeTab === 'rooms' && (
                    <>
                      <p className="font-bold text-indigo-600">{user.totalRoomsHosted || 0}</p>
                      <p className="text-xs text-gray-500">rooms hosted</p>
                    </>
                  )}
                  {activeTab === 'time' && (
                    <>
                      <p className="font-bold text-indigo-600">
                        {Math.floor((user.totalSpeakingTime || 0) / 60)}h {(user.totalSpeakingTime || 0) % 60}m
                      </p>
                      <p className="text-xs text-gray-500">speaking time</p>
                    </>
                  )}
                </div>

                {/* Badge Preview */}
                {user.badges && user.badges.length > 0 && (
                  <div className="ml-4 flex space-x-1">
                    {user.badges.slice(0, 3).map((badge, i) => (
                      <span key={i} className="text-lg" title={badge.name}>
                        {badge.icon}
                      </span>
                    ))}
                  </div>
                )}
              </Link>
            ))}

            {leaders.length === 0 && (
              <div className="text-center py-12">
                <Award className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No data yet</h3>
                <p className="mt-1 text-sm text-gray-500">Start participating to appear on leaderboards!</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Leaderboards;
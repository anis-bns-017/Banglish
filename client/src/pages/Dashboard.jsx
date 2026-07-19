import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";
import {
  LogOut,
  User,
  Mail,
  Calendar,
  Users,
  MessageCircle,
  Mic,
  PlusCircle,
  TrendingUp,
  Clock,
  Globe,
  Lock,
  ChevronRight,
  DollarSign,
  Trophy,
  Medal,
  Award,
  Sparkles,
  Music,
  Gamepad2,
  BookOpen,
  Coffee,
  Zap,
  Crown,
  Star,
  Bell,
  Activity,
  CheckCircle,
  Flame,
  Gift
} from "lucide-react";
import axios from "../utils/axios";
import Recommendations from "../components/Recommendations";

const Dashboard = () => {
  const { user, logout } = useAuth();
  const [recentRooms, setRecentRooms] = useState([]);
  const [popularRooms, setPopularRooms] = useState([]);
  const [topUsers, setTopUsers] = useState([]);
  const [greeting, setGreeting] = useState("");
  const [stats, setStats] = useState({
    totalJoined: 0,
    totalHosted: 0,
    hoursListened: 0
  });
  const [loading, setLoading] = useState(true);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(true);

  useEffect(() => {
    setGreeting(getGreeting());
    fetchRooms();
    fetchTopUsers();
    fetchUserStats();
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const fetchUserStats = async () => {
    try {
      const response = await axios.get("/users/stats");
      setStats(response.data);
    } catch (error) {
      console.error("Failed to fetch user stats:", error);
    }
  };

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const [recentRes, popularRes] = await Promise.all([
        axios.get("/rooms?limit=4&sort=-createdAt"),
        axios.get("/rooms?limit=4&sort=-participantCount")
      ]);
      setRecentRooms(recentRes.data.rooms || []);
      setPopularRooms(popularRes.data.rooms || []);
    } catch (error) {
      console.error("Failed to fetch rooms:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTopUsers = async () => {
    try {
      const response = await axios.get("/users/leaderboards?type=xp&limit=5");
      setTopUsers(response.data.leaders?.slice(0, 5) || []);
    } catch (error) {
      console.error("Failed to fetch leaderboard:", error);
    } finally {
      setLoadingLeaderboard(false);
    }
  };

  const getCategoryColor = (category) => {
    const colors = {
      language: "bg-green-100 text-green-800",
      music: "bg-purple-100 text-purple-800",
      gaming: "bg-red-100 text-red-800",
      tech: "bg-blue-100 text-blue-800",
      social: "bg-yellow-100 text-yellow-800",
      education: "bg-indigo-100 text-indigo-800",
      other: "bg-gray-100 text-gray-800",
    };
    return colors[category] || "bg-gray-100 text-gray-800";
  };

  const getCategoryIcon = (category) => {
    const icons = {
      language: BookOpen,
      music: Music,
      gaming: Gamepad2,
      tech: Zap,
      social: Coffee,
      education: BookOpen,
      other: MessageCircle
    };
    const Icon = icons[category] || MessageCircle;
    return <Icon className="h-3 w-3" />;
  };

  const calculateNextLevelXP = () => {
    const currentLevel = user?.level || 1;
    return currentLevel * 100;
  };

  const calculateProgress = () => {
    const currentXP = user?.xp || 0;
    const nextLevelXP = calculateNextLevelXP();
    return Math.min(100, (currentXP / nextLevelXP) * 100);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link to="/dashboard" className="flex items-center group">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                  <span className="text-white text-sm font-bold">B</span>
                </div>
                <span className="ml-2 text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  Banglish
                </span>
              </Link>
            </div>

            <div className="flex items-center space-x-2">
              <button className="p-2 text-gray-500 hover:text-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors relative">
                <Bell className="h-5 w-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>

              <Link
                to="/rooms"
                className="hidden md:flex items-center px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all text-sm font-medium shadow-md hover:shadow-lg"
              >
                <Users className="h-4 w-4 mr-2" />
                Browse Rooms
              </Link>

              <Link
                to="/profile"
                className="hidden md:flex items-center px-3 py-2 text-gray-600 hover:text-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors text-sm font-medium"
              >
                <User className="h-4 w-4 mr-1" />
                Profile
              </Link>

              {user?.isCreator && (
                <Link
                  to="/creator/dashboard"
                  className="hidden md:flex items-center px-3 py-2 text-gray-600 hover:text-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors text-sm font-medium"
                >
                  <DollarSign className="h-4 w-4 mr-1" />
                  Creator Studio
                </Link>
              )}

              <button
                onClick={logout}
                className="flex items-center px-3 py-2 text-gray-600 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors text-sm font-medium"
              >
                <LogOut className="h-4 w-4 mr-1" />
                <span className="hidden md:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Welcome Section with Stats Cards */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                  {greeting}, {user?.fullName?.split(' ')[0] || user?.username}!
                </h1>
                {user?.level > 5 && (
                  <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full flex items-center gap-1">
                    <Flame className="h-3 w-3" />
                    Hot Streak!
                  </span>
                )}
              </div>
              <p className="text-gray-500 mt-1">Ready to connect and share your voice?</p>
            </div>
            
            {/* Achievement Badge */}
            <div className="flex items-center gap-2 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl px-4 py-2 border border-amber-200">
              <Gift className="h-5 w-5 text-amber-600" />
              <div>
                <p className="text-xs text-amber-600 font-medium">Daily Streak</p>
                <p className="text-sm font-bold text-amber-700">{stats.hoursListened || 0} hours this week</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions Grid - Modern Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          {[
            { icon: Users, title: "Browse Rooms", desc: "Find conversations", link: "/rooms", color: "indigo", gradient: "from-indigo-500 to-indigo-600" },
            { icon: PlusCircle, title: "Create Room", desc: "Start voice chat", link: "/rooms?create=true", color: "green", gradient: "from-green-500 to-emerald-600" },
            { icon: User, title: "Your Profile", desc: "Manage account", link: "/profile", color: "purple", gradient: "from-purple-500 to-pink-600" },
            { icon: Trophy, title: "Leaderboard", desc: "Top contributors", link: "/leaderboards", color: "yellow", gradient: "from-yellow-500 to-orange-600" }
          ].map((action, idx) => (
            <Link
              key={idx}
              to={action.link}
              className="group bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden border border-gray-100 hover:border-transparent"
            >
              <div className="p-5">
                <div className="flex items-start justify-between">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${action.gradient} flex items-center justify-center shadow-md group-hover:scale-110 transition-transform`}>
                    <action.icon className="h-6 w-6 text-white" />
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-300 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all" />
                </div>
                <div className="mt-4">
                  <h3 className="font-semibold text-gray-900">{action.title}</h3>
                  <p className="text-sm text-gray-500 mt-1">{action.desc}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Main Two-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Left Column - User Stats & Progress */}
          <div className="lg:col-span-2 space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl shadow-sm p-4 hover:shadow-md transition-shadow border border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                    <User className="h-5 w-5 text-indigo-600" />
                  </div>
                  <span className="text-2xl font-bold text-indigo-600">{user?.level || 1}</span>
                </div>
                <p className="text-sm font-medium text-gray-900">Level {user?.level}</p>
                <p className="text-xs text-gray-500">@{user?.username}</p>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-4 hover:shadow-md transition-shadow border border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                    <Activity className="h-5 w-5 text-purple-600" />
                  </div>
                  <span className="text-2xl font-bold text-purple-600">{stats.totalJoined || 0}</span>
                </div>
                <p className="text-sm font-medium text-gray-900">Rooms Joined</p>
                <p className="text-xs text-gray-500">Total participation</p>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-4 hover:shadow-md transition-shadow border border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                    <Users className="h-5 w-5 text-green-600" />
                  </div>
                  <span className="text-2xl font-bold text-green-600">{stats.totalHosted || 0}</span>
                </div>
                <p className="text-sm font-medium text-gray-900">Rooms Hosted</p>
                <p className="text-xs text-gray-500">You're a host!</p>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-4 hover:shadow-md transition-shadow border border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center">
                    <Clock className="h-5 w-5 text-yellow-600" />
                  </div>
                  <span className="text-2xl font-bold text-yellow-600">{user?.xp || 0}</span>
                </div>
                <p className="text-sm font-medium text-gray-900">XP Points</p>
                <p className="text-xs text-gray-500">Total experience</p>
              </div>
            </div>

            {/* Progress Card */}
            <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-gray-900">Your Progress</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Keep going to level up!</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">Level {user?.level || 1}</span>
                  <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full transition-all duration-500"
                      style={{ width: `${calculateProgress()}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium text-indigo-600">
                    {user?.xp || 0}/{calculateNextLevelXP()} XP
                  </span>
                </div>
              </div>

              {/* Next Level Rewards */}
              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-3 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-indigo-700">Next Level Reward</span>
                  <span className="font-semibold text-indigo-800">+100 XP + New Badge!</span>
                </div>
              </div>

              {/* Badges */}
              {user?.badges?.length > 0 && (
                <div className="pt-3 border-t border-gray-100">
                  <div className="flex items-center gap-2 mb-3">
                    <Award className="h-4 w-4 text-yellow-500" />
                    <h4 className="text-sm font-medium text-gray-700">Your Badges</h4>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {user.badges.slice(0, 4).map((badge, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 bg-gradient-to-r from-yellow-50 to-amber-50 rounded-lg border border-yellow-200 group hover:scale-105 transition-transform cursor-help"
                        title={badge.description}
                      >
                        <span className="text-base">{badge.icon}</span>
                        <span className="text-xs font-medium text-yellow-800">{badge.name}</span>
                      </div>
                    ))}
                    {user.badges.length > 4 && (
                      <div className="px-2.5 py-1.5 bg-gray-100 rounded-lg text-xs text-gray-600">
                        +{user.badges.length - 4} more
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Recommendations Component */}
            <Recommendations />
          </div>

          {/* Right Column - Leaderboard & Stats */}
          <div className="space-y-6">
            {/* Top Contributors Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden sticky top-20">
              <div className="bg-gradient-to-r from-yellow-50 to-orange-50 px-5 py-4 border-b border-yellow-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-yellow-600" />
                    <h2 className="font-semibold text-gray-900">Top Contributors</h2>
                  </div>
                  <Link
                    to="/leaderboards"
                    className="text-xs font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                  >
                    View All
                    <ChevronRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>

              <div className="p-4">
                {loadingLeaderboard ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-600 border-t-transparent"></div>
                  </div>
                ) : topUsers.length > 0 ? (
                  <div className="space-y-3">
                    {topUsers.map((leader, index) => (
                      <Link
                        key={leader._id}
                        to={`/profile/${leader._id}`}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-all group"
                      >
                        <div className="relative">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm ${
                            index === 0 ? "bg-gradient-to-br from-yellow-400 to-yellow-600 text-white shadow-md" :
                            index === 1 ? "bg-gradient-to-br from-gray-400 to-gray-600 text-white" :
                            index === 2 ? "bg-gradient-to-br from-orange-400 to-orange-600 text-white" :
                            "bg-gray-100 text-gray-600"
                          }`}>
                            {index === 0 ? <Crown className="h-5 w-5" /> : 
                             index === 1 ? <Medal className="h-5 w-5" /> :
                             index === 2 ? <Medal className="h-5 w-5" /> :
                             `#${index + 1}`}
                          </div>
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {leader.fullName || leader.username}
                            </p>
                            {leader.isCreator && (
                              <Star className="h-3 w-3 text-yellow-500 fill-current" />
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-gray-500">Level {leader.level || 1}</span>
                            <span className="text-xs text-gray-300">•</span>
                            <span className="text-xs font-semibold text-indigo-600">{leader.xp?.toLocaleString()} XP</span>
                          </div>
                        </div>

                        {index < 3 && (
                          <div className="text-2xl">
                            {index === 0 && "🥇"}
                            {index === 1 && "🥈"}
                            {index === 2 && "🥉"}
                          </div>
                        )}
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Award className="h-8 w-8 text-gray-400" />
                    </div>
                    <p className="text-sm text-gray-500">No contributors yet</p>
                    <p className="text-xs text-gray-400 mt-1">Be the first to earn XP!</p>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Tip Card */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl p-4 text-white">
              <Sparkles className="h-6 w-6 mb-2 opacity-80" />
              <h3 className="font-semibold text-sm mb-1">Pro Tip</h3>
              <p className="text-xs opacity-90">Host regular rooms to earn more XP and unlock special badges!</p>
            </div>
          </div>
        </div>

        {/* Recent Rooms Section */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Recent Active Rooms</h2>
              <p className="text-sm text-gray-500 mt-0.5">Fresh conversations happening now</p>
            </div>
            <Link
              to="/rooms"
              className="text-sm font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
            >
              View all
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-3 border-indigo-600 border-t-transparent"></div>
            </div>
          ) : recentRooms.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              {recentRooms.map((room) => (
                <Link
                  key={room._id}
                  to={`/room/${room._id}`}
                  className="group bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden border border-gray-100 hover:border-indigo-200"
                >
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-1.5">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium ${getCategoryColor(room.category)}`}>
                          {getCategoryIcon(room.category)}
                          {room.category}
                        </span>
                        {room.language && room.language !== "English" && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-lg text-xs">
                            {room.language}
                          </span>
                        )}
                      </div>
                      {room.isPrivate ? (
                        <Lock className="h-3.5 w-3.5 text-gray-400" />
                      ) : (
                        <Globe className="h-3.5 w-3.5 text-gray-400" />
                      )}
                    </div>

                    <h3 className="font-semibold text-gray-900 mb-1 group-hover:text-indigo-600 transition-colors line-clamp-1">
                      {room.name}
                    </h3>

                    {room.description && (
                      <p className="text-xs text-gray-500 mb-3 line-clamp-2">{room.description}</p>
                    )}

                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5">
                        <div className="flex items-center gap-1 text-gray-500">
                          <Users className="h-3 w-3" />
                          <span>{room.participantCount}/{room.maxParticipants || 50}</span>
                        </div>
                        <div className="flex items-center gap-1 text-gray-500">
                          <Mic className="h-3 w-3" />
                          <span>{room.participants?.filter(p => !p.isMuted).length || 0}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-gray-400">
                        <Clock className="h-3 w-3" />
                        <span className="text-xs">{new Date(room.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>

                    {room.host && (
                      <div className="mt-3 pt-2 border-t border-gray-50 flex items-center gap-1.5">
                        {room.host.avatar ? (
                          <img src={room.host.avatar} alt="" className="h-4 w-4 rounded-full object-cover" />
                        ) : (
                          <div className="h-4 w-4 rounded-full bg-indigo-100 flex items-center justify-center">
                            <span className="text-[8px] font-medium text-indigo-600">
                              {room.host.username?.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                        <span className="text-xs text-gray-500 truncate">{room.host.username}</span>
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm p-8 text-center border border-gray-100">
              <MessageCircle className="mx-auto h-12 w-12 text-gray-300" />
              <h3 className="mt-3 text-sm font-medium text-gray-900">No rooms yet</h3>
              <p className="mt-1 text-sm text-gray-500">Get started by creating a new room.</p>
              <Link
                to="/rooms?create=true"
                className="inline-flex items-center gap-2 px-4 py-2 mt-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
              >
                <PlusCircle className="h-4 w-4" />
                Create Room
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
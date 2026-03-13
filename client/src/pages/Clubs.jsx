import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, Lock, Globe, Search, Filter,
  PlusCircle, Calendar, Hash, ChevronRight
} from 'lucide-react';
import axios from '../utils/axios';
import CreateClubModal from '../components/CreateClubModal';

const Clubs = () => {
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filters, setFilters] = useState({
    category: '',
    search: '',
    page: 1
  });

  const categories = [
    'language', 'music', 'gaming', 'tech', 
    'social', 'education', 'professional', 'other'
  ];

  useEffect(() => {
    fetchClubs();
  }, [filters.page]);

  const fetchClubs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: filters.page,
        ...(filters.category && { category: filters.category }),
        ...(filters.search && { search: filters.search })
      });

      const response = await axios.get(`/clubs?${params}`);
      setClubs(response.data.clubs);
    } catch (error) {
      console.error('Failed to fetch clubs:', error);
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
      professional: 'bg-gray-100 text-gray-800',
      other: 'bg-gray-100 text-gray-800'
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Communities</h1>
              <p className="text-sm text-gray-500 mt-1">
                Join communities that share your interests
              </p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              <PlusCircle className="h-4 w-4 mr-2" />
              Create Community
            </button>
          </div>

          {/* Search and Filters */}
          <div className="mt-4 flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search communities..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                onKeyPress={(e) => e.key === 'Enter' && fetchClubs()}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <select
              value={filters.category}
              onChange={(e) => setFilters({ ...filters, category: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">All Categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </option>
              ))}
            </select>
            <button
              onClick={fetchClubs}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-2"
            >
              <Filter className="h-4 w-4" />
              Apply Filters
            </button>
          </div>
        </div>
      </div>

      {/* Clubs Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {clubs.map((club) => (
                <Link
                  key={club._id}
                  to={`/club/${club._id}`}
                  className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow overflow-hidden border border-gray-200"
                >
                  {/* Cover Image */}
                  <div className="h-24 bg-gradient-to-r from-indigo-500 to-purple-600 relative">
                    {club.coverImage && (
                      <img 
                        src={club.coverImage} 
                        alt="" 
                        className="w-full h-full object-cover"
                      />
                    )}
                    
                    {/* Avatar */}
                    <div className="absolute -bottom-8 left-4">
                      {club.avatar ? (
                        <img 
                          src={club.avatar} 
                          alt={club.name}
                          className="h-16 w-16 rounded-full border-4 border-white"
                        />
                      ) : (
                        <div className="h-16 w-16 rounded-full border-4 border-white bg-indigo-100 flex items-center justify-center">
                          <span className="text-xl font-bold text-indigo-600">
                            {club.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Privacy Badge */}
                    <div className="absolute top-2 right-2">
                      {club.isPrivate ? (
                        <div className="bg-gray-900 bg-opacity-75 text-white p-1 rounded-full">
                          <Lock className="h-4 w-4" />
                        </div>
                      ) : (
                        <div className="bg-gray-900 bg-opacity-75 text-white p-1 rounded-full">
                          <Globe className="h-4 w-4" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="pt-10 p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-semibold text-gray-900">{club.name}</h3>
                        <span className={`inline-block mt-1 px-2 py-1 text-xs rounded-full ${getCategoryColor(club.category)}`}>
                          {club.category}
                        </span>
                      </div>
                    </div>

                    <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                      {club.description || 'No description'}
                    </p>

                    {/* Stats */}
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <div className="flex items-center">
                        <Users className="h-4 w-4 mr-1" />
                        <span>{club.memberCount} members</span>
                      </div>
                      <div className="flex items-center">
                        <Hash className="h-4 w-4 mr-1" />
                        <span>{club.totalRooms || 0} rooms</span>
                      </div>
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        <span>{club.totalEvents || 0} events</span>
                      </div>
                    </div>

                    {/* Tags */}
                    {club.tags && club.tags.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-100 flex flex-wrap gap-1">
                        {club.tags.slice(0, 3).map(tag => (
                          <span 
                            key={tag}
                            className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>

            {/* Empty State */}
            {clubs.length === 0 && (
              <div className="text-center py-12">
                <Users className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No communities found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Get started by creating a new community
                </p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="mt-4 inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Create Community
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Create Club Modal */}
      {showCreateModal && (
        <CreateClubModal
          onClose={() => setShowCreateModal(false)}
          onClubCreated={fetchClubs}
        />
      )}
    </div>
  );
};

export default Clubs;
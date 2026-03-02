import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Users, Lock, Globe, Mic, MicOff, Search, Filter } from "lucide-react";
import axios from "../utils/axios";
import CreateRoomModal from "../components/CreateRoomModal";
import { useSearchParams } from "react-router-dom";

const Rooms = () => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filters, setFilters] = useState({
    category: "",
    language: "",
    search: "",
  });
  const [searchParams] = useSearchParams();

  useEffect(() => {
    // Check if create modal should be shown
    if (searchParams.get("create") === "true") {
      setShowCreateModal(true);
    }
  }, [searchParams]);

  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
  });

  useEffect(() => {
    fetchRooms();
  }, [filters.page]);

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: filters.page,
        ...(filters.category && { category: filters.category }),
        ...(filters.language && { language: filters.language }),
        ...(filters.search && { search: filters.search }),
      });

      const response = await axios.get(`/rooms?${params}`);
      setRooms(response.data.rooms);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error("Failed to fetch rooms:", error);
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    "all",
    "language",
    "music",
    "gaming",
    "tech",
    "social",
    "education",
    "other",
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Voice Rooms</h1>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Create Room
            </button>
          </div>

          {/* Search and Filters */}
          <div className="mt-4 flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search rooms..."
                value={filters.search}
                onChange={(e) =>
                  setFilters({ ...filters, search: e.target.value })
                }
                onKeyPress={(e) => e.key === "Enter" && fetchRooms()}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <select
              value={filters.category}
              onChange={(e) =>
                setFilters({ ...filters, category: e.target.value })
              }
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat === "all" ? "" : cat}>
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </option>
              ))}
            </select>
            <button
              onClick={fetchRooms}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-2"
            >
              <Filter className="h-4 w-4" />
              Apply Filters
            </button>
          </div>
        </div>
      </div>

      {/* Rooms Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {rooms.map((room) => (
                <Link
                  key={room._id}
                  to={`/room/${room._id}`}
                  className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow overflow-hidden"
                >
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                          {room.name}
                        </h3>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                          {room.category}
                        </span>
                      </div>
                      {room.isPrivate ? (
                        <Lock className="h-5 w-5 text-gray-400" />
                      ) : (
                        <Globe className="h-5 w-5 text-gray-400" />
                      )}
                    </div>

                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                      {room.description || "No description"}
                    </p>

                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        <span>
                          {room.participantCount}/{room.maxParticipants}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {room.host && (
                          <>
                            {room.host.avatar ? (
                              <img
                                src={room.host.avatar}
                                alt={room.host.username}
                                className="h-6 w-6 rounded-full"
                              />
                            ) : (
                              <div className="h-6 w-6 rounded-full bg-indigo-100 flex items-center justify-center">
                                <span className="text-xs font-medium text-indigo-600">
                                  {room.host.username?.charAt(0).toUpperCase()}
                                </span>
                              </div>
                            )}
                            <span className="truncate max-w-[100px]">
                              {room.host.username}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Active speakers preview */}
                    {room.participants?.filter((p) => !p.isMuted).length >
                      0 && (
                      <div className="mt-4 pt-4 border-t border-gray-100">
                        <div className="flex items-center gap-2 text-xs text-green-600">
                          <Mic className="h-3 w-3" />
                          <span>
                            {room.participants.filter((p) => !p.isMuted).length}{" "}
                            speaking
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="mt-8 flex justify-center gap-2">
                <button
                  onClick={() =>
                    setFilters({ ...filters, page: filters.page - 1 })
                  }
                  disabled={filters.page === 1}
                  className="px-4 py-2 border border-gray-300 rounded-md disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="px-4 py-2">
                  Page {filters.page} of {pagination.totalPages}
                </span>
                <button
                  onClick={() =>
                    setFilters({ ...filters, page: filters.page + 1 })
                  }
                  disabled={filters.page === pagination.totalPages}
                  className="px-4 py-2 border border-gray-300 rounded-md disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Create Room Modal */}
      {showCreateModal && (
        <CreateRoomModal
          onClose={() => setShowCreateModal(false)}
          onRoomCreated={fetchRooms}
        />
      )}
    </div>
  );
};

export default Rooms;

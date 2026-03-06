import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import {
  User,
  Mail,
  Calendar,
  Edit2,
  Save,
  Camera,
  Lock,
  ChevronRight,
  DollarSign,
  Clock,
  Award,
  Star,
  TrendingUp,
  Zap,
  Globe,
  Bell,
  CreditCard,
  Ticket,
} from "lucide-react";
import axios from "../utils/axios";
import toast from "react-hot-toast";
import LanguagePreferences from "../components/LanguagePreferences";
import { Link } from "react-router-dom";

const Profile = () => {
  const { user, setUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showLanguagePrefs, setShowLanguagePrefs] = useState(false);
  const [showInterestsModal, setShowInterestsModal] = useState(false);
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    username: "",
    bio: "",
    creatorBio: "",
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({});
  const [interestInput, setInterestInput] = useState("");
  const [tempInterests, setTempInterests] = useState([]);
  const [notificationPrefs, setNotificationPrefs] = useState({
    newFollowers: true,
    roomReminders: true,
    friendActivity: true,
    recommendations: true,
  });

  useEffect(() => {
    if (user) {
      setFormData({
        fullName: user.fullName || "",
        username: user.username || "",
        bio: user.bio || "",
        creatorBio: user.creatorBio || "",
      });
      setTempInterests(user.interests || []);
      setNotificationPrefs({
        newFollowers: user.notificationPreferences?.newFollowers ?? true,
        roomReminders: user.notificationPreferences?.roomReminders ?? true,
        friendActivity: user.notificationPreferences?.friendActivity ?? true,
        recommendations: user.notificationPreferences?.recommendations ?? true,
      });
    }
  }, [user]);

  // Function to fetch updated user profile
  const fetchUserProfile = async () => {
    try {
      const response = await axios.get("/profile/me");
      setUser(response.data.user);
    } catch (error) {
      console.error("Failed to fetch user profile:", error);
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handlePasswordChange = (e) => {
    setPasswordData({
      ...passwordData,
      [e.target.name]: e.target.value,
    });
  };

  const validateProfile = () => {
    const newErrors = {};

    if (formData.username.length < 3) {
      newErrors.username = "Username must be at least 3 characters";
    }
    if (formData.username.length > 20) {
      newErrors.username = "Username cannot exceed 20 characters";
    }
    if (formData.bio && formData.bio.length > 200) {
      newErrors.bio = "Bio cannot exceed 200 characters";
    }
    if (formData.creatorBio && formData.creatorBio.length > 500) {
      newErrors.creatorBio = "Creator bio cannot exceed 500 characters";
    }

    return newErrors;
  };

  const validatePassword = () => {
    const newErrors = {};

    if (!passwordData.currentPassword) {
      newErrors.currentPassword = "Current password is required";
    }
    if (passwordData.newPassword.length < 6) {
      newErrors.newPassword = "New password must be at least 6 characters";
    } else if (passwordData.newPassword.length > 50) {
      newErrors.newPassword = "Password is too long";
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    return newErrors;
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();

    const newErrors = validateProfile();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      const response = await axios.put("/profile/me", formData);
      setUser(response.data.user);
      toast.success("Profile updated successfully");
      setIsEditing(false);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();

    const newErrors = validatePassword();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      await axios.put("/profile/change-password", {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      toast.success("Password changed successfully");
      setIsChangingPassword(false);
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to change password");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateInterests = async () => {
    try {
      const response = await axios.put("/profile/interests", {
        interests: tempInterests,
      });
      setUser(response.data.user);
      toast.success("Interests updated successfully");
      setShowInterestsModal(false);
    } catch (error) {
      toast.error("Failed to update interests");
    }
  };

  const handleUpdateNotifications = async () => {
    try {
      const response = await axios.put("/profile/notifications", {
        preferences: notificationPrefs,
      });
      setUser(response.data.user);
      toast.success("Notification preferences updated");
      setShowNotificationsModal(false);
    } catch (error) {
      toast.error("Failed to update notification preferences");
    }
  };

  const addInterest = () => {
    if (interestInput.trim() && !tempInterests.includes(interestInput.trim())) {
      setTempInterests([...tempInterests, interestInput.trim()]);
      setInterestInput("");
    }
  };

  const removeInterest = (interestToRemove) => {
    setTempInterests(tempInterests.filter((interest) => interest !== interestToRemove));
  };

  // Calculate next level XP requirement
  const nextLevelXP = user?.level ? (user.level * 100) : 100;
  const xpProgress = user?.xp ? (user.xp % 100) : 0;
  const progressPercentage = (xpProgress / 100) * 100;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="h-8 w-8 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-center">
                <span className="text-white text-sm font-bold">H</span>
              </div>
              <span className="ml-2 text-xl font-semibold text-gray-900">
                Profile
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => window.history.back()}
                className="text-gray-600 hover:text-gray-900"
              >
                Back
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Profile Header */}
        <div className="bg-white shadow rounded-lg mb-6">
          <div className="px-6 py-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-6">
                <div className="relative">
                  <div className="h-24 w-24 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-center text-white text-3xl font-bold">
                    {user?.fullName?.charAt(0) || user?.username?.charAt(0)}
                  </div>
                  <button className="absolute bottom-0 right-0 bg-white rounded-full p-2 shadow-lg hover:bg-gray-50">
                    <Camera className="h-4 w-4 text-gray-600" />
                  </button>
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-2xl font-bold text-gray-900">
                      {user?.fullName}
                    </h1>
                    {user?.isCreator && (
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full whitespace-nowrap">
                        Verified Creator
                      </span>
                    )}
                  </div>
                  <p className="text-gray-500">@{user?.username}</p>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-2 ${
                      user?.role === "admin"
                        ? "bg-purple-100 text-purple-800"
                        : user?.role === "moderator"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-green-100 text-green-800"
                    }`}
                  >
                    {user?.role}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <Edit2 className="h-4 w-4 mr-2" />
                Edit Profile
              </button>
            </div>
          </div>
        </div>

        {/* Language Learning Section */}
        <div className="bg-white shadow rounded-lg mb-6">
          <div className="px-6 py-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium text-gray-900">
                Language Learning
              </h2>
              <button
                onClick={() => setShowLanguagePrefs(true)}
                className="text-sm text-indigo-600 hover:text-indigo-500"
              >
                Update Preferences
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">Native Language</p>
                <p className="font-medium">
                  {user?.nativeLanguage || "Not set"}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Learning</p>
                {user?.learningLanguages?.length > 0 ? (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {user.learningLanguages.map((lang, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800"
                      >
                        {lang.language} - {lang.level}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-600">No languages set</p>
                )}
              </div>

              <div className="pt-4">
                <Link
                  to="/rooms?type=language"
                  className="inline-flex items-center text-indigo-600 hover:text-indigo-500"
                >
                  Find language exchange rooms
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Language Preferences Modal */}
        {showLanguagePrefs && (
          <LanguagePreferences
            onClose={() => setShowLanguagePrefs(false)}
            onUpdate={fetchUserProfile}
          />
        )}

        {/* Gamification Stats */}
        <div className="bg-white shadow rounded-lg mb-6">
          <div className="px-6 py-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Your Stats</h2>
            
            {/* Level Progress */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-yellow-500" />
                  <span className="font-semibold">Level {user?.level || 1}</span>
                </div>
                <span className="text-sm text-gray-600">
                  {user?.xp || 0} / {nextLevelXP} XP
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 h-2.5 rounded-full transition-all duration-300"
                  style={{ width: `${progressPercentage}%` }}
                ></div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-indigo-50 rounded-lg">
                <div className="text-2xl font-bold text-indigo-600">{user?.level || 1}</div>
                <div className="text-xs text-gray-600">Level</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{user?.xp || 0}</div>
                <div className="text-xs text-gray-600">XP</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{user?.totalRoomsHosted || 0}</div>
                <div className="text-xs text-gray-600">Rooms Hosted</div>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{user?.totalRoomsJoined || 0}</div>
                <div className="text-xs text-gray-600">Rooms Joined</div>
              </div>
            </div>

            {/* Badges */}
            {user?.badges && user.badges.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <Award className="h-4 w-4 text-yellow-500" />
                  Badges Earned
                </h3>
                <div className="flex flex-wrap gap-2">
                  {user.badges.map((badge, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-help"
                      title={badge.description}
                    >
                      <span className="text-xl">{badge.icon}</span>
                      <span className="text-sm font-medium">{badge.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Interests Section */}
        <div className="bg-white shadow rounded-lg mb-6">
          <div className="px-6 py-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium text-gray-900">Interests</h2>
              <button
                onClick={() => setShowInterestsModal(true)}
                className="text-sm text-indigo-600 hover:text-indigo-500"
              >
                Edit Interests
              </button>
            </div>
            
            {user?.interests && user.interests.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {user.interests.map((interest, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                  >
                    {interest}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No interests added yet</p>
            )}
          </div>
        </div>

        {/* Interests Modal */}
        {showInterestsModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg max-w-md w-full mx-4 p-6">
              <h3 className="text-lg font-semibold mb-4">Edit Interests</h3>
              <div className="space-y-4">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={interestInput}
                    onChange={(e) => setInterestInput(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && addInterest()}
                    placeholder="Add an interest"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  <button
                    onClick={addInterest}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-2 min-h-[100px] border rounded-lg p-3">
                  {tempInterests.map((interest) => (
                    <span
                      key={interest}
                      className="inline-flex items-center px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm"
                    >
                      {interest}
                      <button
                        onClick={() => removeInterest(interest)}
                        className="ml-2 text-indigo-600 hover:text-indigo-800"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                  {tempInterests.length === 0 && (
                    <p className="text-gray-400 text-sm">No interests added</p>
                  )}
                </div>
                <div className="flex justify-end gap-3 mt-4">
                  <button
                    onClick={() => setShowInterestsModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpdateInterests}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Profile Info */}
        <div className="bg-white shadow rounded-lg mb-6">
          <div className="px-6 py-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Profile Information
            </h2>

            {isEditing ? (
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Full Name
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Username
                  </label>
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    className={`mt-1 block w-full border ${
                      errors.username ? "border-red-300" : "border-gray-300"
                    } rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
                  />
                  {errors.username && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.username}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Bio
                  </label>
                  <textarea
                    name="bio"
                    rows="3"
                    value={formData.bio}
                    onChange={handleInputChange}
                    className={`mt-1 block w-full border ${
                      errors.bio ? "border-red-300" : "border-gray-300"
                    } rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
                    placeholder="Tell us about yourself..."
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    {formData.bio.length}/200 characters
                  </p>
                  {errors.bio && (
                    <p className="mt-1 text-sm text-red-600">{errors.bio}</p>
                  )}
                </div>

                {user?.isCreator && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Creator Bio
                    </label>
                    <textarea
                      name="creatorBio"
                      rows="3"
                      value={formData.creatorBio}
                      onChange={handleInputChange}
                      className={`mt-1 block w-full border ${
                        errors.creatorBio ? "border-red-300" : "border-gray-300"
                      } rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
                      placeholder="Tell your audience about your content..."
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      {formData.creatorBio.length}/500 characters
                    </p>
                    {errors.creatorBio && (
                      <p className="mt-1 text-sm text-red-600">{errors.creatorBio}</p>
                    )}
                  </div>
                )}

                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {loading ? (
                      "Saving..."
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save Changes
                      </>
                    )}
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center text-gray-700">
                  <User className="h-5 w-5 mr-3 text-gray-400" />
                  <span>{user?.fullName}</span>
                </div>
                <div className="flex items-center text-gray-700">
                  <Mail className="h-5 w-5 mr-3 text-gray-400" />
                  <span>{user?.email}</span>
                </div>
                <div className="flex items-center text-gray-700">
                  <Calendar className="h-5 w-5 mr-3 text-gray-400" />
                  <span>
                    Joined {new Date(user?.createdAt).toLocaleDateString()}
                  </span>
                </div>
                {user?.bio && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-gray-700">{user.bio}</p>
                  </div>
                )}
                {user?.isCreator && user?.creatorBio && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Creator Bio</h3>
                    <p className="text-gray-700">{user.creatorBio}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Notification Preferences */}
        <div className="bg-white shadow rounded-lg mb-6">
          <div className="px-6 py-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                <Bell className="h-5 w-5 text-gray-500" />
                Notification Preferences
              </h2>
              <button
                onClick={() => setShowNotificationsModal(true)}
                className="text-sm text-indigo-600 hover:text-indigo-500"
              >
                Edit Preferences
              </button>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">New Followers</span>
                <span className={user?.notificationPreferences?.newFollowers ? "text-green-600" : "text-gray-400"}>
                  {user?.notificationPreferences?.newFollowers ? "Enabled" : "Disabled"}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Room Reminders</span>
                <span className={user?.notificationPreferences?.roomReminders ? "text-green-600" : "text-gray-400"}>
                  {user?.notificationPreferences?.roomReminders ? "Enabled" : "Disabled"}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Friend Activity</span>
                <span className={user?.notificationPreferences?.friendActivity ? "text-green-600" : "text-gray-400"}>
                  {user?.notificationPreferences?.friendActivity ? "Enabled" : "Disabled"}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Recommendations</span>
                <span className={user?.notificationPreferences?.recommendations ? "text-green-600" : "text-gray-400"}>
                  {user?.notificationPreferences?.recommendations ? "Enabled" : "Disabled"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Notifications Modal */}
        {showNotificationsModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg max-w-md w-full mx-4 p-6">
              <h3 className="text-lg font-semibold mb-4">Notification Preferences</h3>
              <div className="space-y-4">
                <label className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">New Followers</span>
                  <input
                    type="checkbox"
                    checked={notificationPrefs.newFollowers}
                    onChange={(e) => setNotificationPrefs({...notificationPrefs, newFollowers: e.target.checked})}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                </label>
                <label className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">Room Reminders</span>
                  <input
                    type="checkbox"
                    checked={notificationPrefs.roomReminders}
                    onChange={(e) => setNotificationPrefs({...notificationPrefs, roomReminders: e.target.checked})}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                </label>
                <label className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">Friend Activity</span>
                  <input
                    type="checkbox"
                    checked={notificationPrefs.friendActivity}
                    onChange={(e) => setNotificationPrefs({...notificationPrefs, friendActivity: e.target.checked})}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                </label>
                <label className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">Recommendations</span>
                  <input
                    type="checkbox"
                    checked={notificationPrefs.recommendations}
                    onChange={(e) => setNotificationPrefs({...notificationPrefs, recommendations: e.target.checked})}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                </label>
                <div className="flex justify-end gap-3 mt-4">
                  <button
                    onClick={() => setShowNotificationsModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpdateNotifications}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Change Password */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Change Password
            </h2>

            {isChangingPassword ? (
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Current Password
                  </label>
                  <input
                    type="password"
                    name="currentPassword"
                    value={passwordData.currentPassword}
                    onChange={handlePasswordChange}
                    className={`mt-1 block w-full border ${
                      errors.currentPassword
                        ? "border-red-300"
                        : "border-gray-300"
                    } rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
                  />
                  {errors.currentPassword && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.currentPassword}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    New Password
                  </label>
                  <input
                    type="password"
                    name="newPassword"
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    className={`mt-1 block w-full border ${
                      errors.newPassword ? "border-red-300" : "border-gray-300"
                    } rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
                  />
                  {errors.newPassword && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.newPassword}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    className={`mt-1 block w-full border ${
                      errors.confirmPassword
                        ? "border-red-300"
                        : "border-gray-300"
                    } rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
                  />
                  {errors.confirmPassword && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.confirmPassword}
                    </p>
                  )}
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setIsChangingPassword(false);
                      setErrors({});
                      setPasswordData({
                        currentPassword: "",
                        newPassword: "",
                        confirmPassword: "",
                      });
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
                  >
                    <Lock className="h-4 w-4 mr-2" />
                    {loading ? "Changing..." : "Change Password"}
                  </button>
                </div>
              </form>
            ) : (
              <button
                onClick={() => setIsChangingPassword(true)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <Lock className="h-4 w-4 mr-2" />
                Change Password
              </button>
            )}
          </div>
        </div>

        {/* Creator Earnings Section - Only for verified creators */}
        {user?.isCreator && (
          <div className="bg-white shadow rounded-lg mt-6">
            <div className="px-6 py-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-green-500" />
                Creator Earnings
              </h2>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                <div className="p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-gray-600">Available Balance</p>
                  <p className="text-2xl font-bold text-green-600">
                    ${(user?.availableBalance || 0).toFixed(2)}
                  </p>
                </div>
                <div className="p-4 bg-yellow-50 rounded-lg">
                  <p className="text-sm text-gray-600">Pending</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    ${(user?.pendingBalance || 0).toFixed(2)}
                  </p>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg">
                  <p className="text-sm text-gray-600">Lifetime Earnings</p>
                  <p className="text-2xl font-bold text-purple-600">
                    ${(user?.lifetimeEarnings || 0).toFixed(2)}
                  </p>
                </div>
              </div>

              {/* Stripe/PayPal Status */}
              <div className="border-t border-gray-200 pt-4">
                <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-gray-500" />
                  Payout Methods
                </h3>
                <div className="space-y-2">
                  {user?.stripeAccountId ? (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Stripe Account</span>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        user.stripeAccountStatus === 'active' 
                          ? 'bg-green-100 text-green-800' 
                          : user.stripeAccountStatus === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                      }`}>
                        {user.stripeAccountStatus}
                      </span>
                    </div>
                  ) : (
                    <button className="text-sm text-indigo-600 hover:text-indigo-500">
                      Connect Stripe Account
                    </button>
                  )}
                  
                  {user?.paypalEmail && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">PayPal</span>
                      <span className="text-sm text-gray-800">{user.paypalEmail}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Recent Payouts */}
              {user?.payouts && user.payouts.length > 0 && (
                <div className="border-t border-gray-200 mt-4 pt-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Recent Payouts</h3>
                  <div className="space-y-2">
                    {user.payouts.slice(0, 3).map((payout, index) => (
                      <div key={index} className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">
                          {new Date(payout.requestedAt).toLocaleDateString()}
                        </span>
                        <span className="font-medium">${payout.amount}</span>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          payout.status === 'processed' 
                            ? 'bg-green-100 text-green-800'
                            : payout.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                        }`}>
                          {payout.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-4">
                <Link
                  to="/creator/dashboard"
                  className="inline-flex items-center text-indigo-600 hover:text-indigo-500"
                >
                  View Creator Dashboard
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Purchased Tickets Section */}
        {user?.tickets && user.tickets.length > 0 && (
          <div className="bg-white shadow rounded-lg mt-6">
            <div className="px-6 py-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                <Ticket className="h-5 w-5 text-indigo-500" />
                My Tickets
              </h2>
              <div className="space-y-3">
                {user.tickets.slice(0, 3).map((ticket, index) => (
                  <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">Room #{ticket.room}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(ticket.purchasedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <span className="font-semibold text-indigo-600">${ticket.amount}</span>
                  </div>
                ))}
                {user.tickets.length > 3 && (
                  <Link
                    to="/my-tickets"
                    className="block text-center text-sm text-indigo-600 hover:text-indigo-500 mt-2"
                  >
                    View all {user.tickets.length} tickets
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Creator Application Section */}
        {!user?.isCreator && user?.creatorApplication?.status !== "pending" && (
          <div className="bg-white shadow rounded-lg mt-6">
            <div className="px-6 py-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">
                Become a Creator
              </h2>
              <p className="text-gray-600 mb-4">
                Monetize your rooms and earn from your content. Apply to become
                a creator today!
              </p>
              <Link
                to="/creator/apply"
                className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors duration-200"
              >
                <DollarSign className="h-4 w-4 mr-2" />
                Apply for Creator Program
              </Link>
            </div>
          </div>
        )}

        {/* Creator Application Pending Status */}
        {user?.creatorApplication?.status === "pending" && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-6">
            <div className="flex">
              <Clock className="h-5 w-5 text-yellow-600" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  Application Pending
                </h3>
                <p className="text-sm text-yellow-700 mt-1">
                  Your creator application is under review. We'll notify you
                  once it's approved.
                </p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Profile;
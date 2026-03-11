import { getRecommendations, getTrendingTopics, getSmartNotifications } from '../services/recommendationService.js';
import User from '../models/User.js';

// @desc    Get personalized room recommendations
// @route   GET /api/recommendations/rooms
export const getRoomRecommendations = async (req, res) => {
  try {
    const recommendations = await getRecommendations(req.user.id, 20);
    
    res.json({
      success: true,
      recommendations
    });
  } catch (error) {
    console.error('Recommendations error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get trending topics and categories
// @route   GET /api/recommendations/trending
export const getTrending = async (req, res) => {
  try {
    const trending = await getTrendingTopics();
    
    res.json({
      success: true,
      ...trending
    });
  } catch (error) {
    console.error('Trending error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get smart notifications
// @route   GET /api/recommendations/notifications
export const getNotifications = async (req, res) => {
  try {
    const notifications = await getSmartNotifications(req.user.id);
    
    res.json({
      success: true,
      notifications
    });
  } catch (error) {
    console.error('Notifications error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Update user interests based on activity
// @route   POST /api/recommendations/update-interests
export const updateInterests = async (req, res) => {
  try {
    const { roomId, action } = req.body; // action: join, speak, react
    
    const user = await User.findById(req.user.id);
    const room = await Room.findById(roomId);
    
    if (!room) {
      return res.status(404).json({ success: false, message: 'Room not found' });
    }
    
    // Add category to interests if not present
    if (!user.interests.includes(room.category)) {
      user.interests.push(room.category);
    }
    
    // Add tags to interests
    if (room.tags) {
      room.tags.forEach(tag => {
        if (!user.interests.includes(tag)) {
          user.interests.push(tag);
        }
      });
    }
    
    // Limit interests to 50
    if (user.interests.length > 50) {
      user.interests = user.interests.slice(-50);
    }
    
    await user.save();
    
    res.json({
      success: true,
      message: 'Interests updated'
    });
  } catch (error) {
    console.error('Update interests error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
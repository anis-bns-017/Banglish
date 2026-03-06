import User from '../models/User.js';
import Room from '../models/Room.js';

// @desc    Add XP to user
// @route   POST /api/users/add-xp
export const addXP = async (req, res) => {
  try {
    const { amount, reason, roomId } = req.body;
    
    const user = await User.findById(req.user.id);
    
    // Award XP
    await user.addXP(amount);
    
    // Track in room if provided
    if (roomId) {
      await Room.findByIdAndUpdate(roomId, {
        $inc: { totalSpeakingTime: amount * 60 } // Convert minutes to seconds
      });
    }
    
    // Update user stats based on reason
    if (reason === 'speaking') {
      user.totalSpeakingTime += amount * 60;
    } else if (reason === 'hosting') {
      user.totalRoomsHosted += 1;
    } else if (reason === 'joining') {
      user.totalRoomsJoined += 1;
    }
    
    await user.save();
    
    res.json({
      success: true,
      xp: user.xp,
      level: user.level,
      badges: user.badges
    });
  } catch (error) {
    console.error('Add XP error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get leaderboards
// @route   GET /api/users/leaderboards
export const getLeaderboards = async (req, res) => {
  try {
    const { type = 'xp', timeframe = 'all' } = req.query;
    
    let dateFilter = {};
    if (timeframe === 'today') {
      dateFilter = { createdAt: { $gte: new Date().setHours(0,0,0,0) } };
    } else if (timeframe === 'week') {
      dateFilter = { createdAt: { $gte: new Date(Date.now() - 7*24*60*60*1000) } };
    } else if (timeframe === 'month') {
      dateFilter = { createdAt: { $gte: new Date(Date.now() - 30*24*60*60*1000) } };
    }
    
    let sortField = '-xp';
    if (type === 'rooms') sortField = '-totalRoomsHosted';
    if (type === 'time') sortField = '-totalSpeakingTime';
    
    const leaders = await User.find(dateFilter)
      .select('username fullName avatar xp level totalRoomsHosted totalSpeakingTime badges isCreator')
      .sort(sortField)
      .limit(100);
    
    res.json({
      success: true,
      leaders
    });
  } catch (error) {
    console.error('Leaderboards error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
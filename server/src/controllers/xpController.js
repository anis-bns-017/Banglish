import User from '../models/User.js';
import Room from '../models/Room.js';

// @desc    Add XP to user (existing)
// @route   POST /api/users/add-xp
export const addXP = async (req, res) => {
  try {
    const { amount, reason, roomId } = req.body;
    
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }
    
    // Add XP
    user.xp = (user.xp || 0) + amount;
    
    // Calculate new level
    const newLevel = Math.floor(Math.sqrt(user.xp / 100)) + 1;
    
    // Check if level up
    let levelUp = false;
    if (newLevel > (user.level || 1)) {
      levelUp = true;
      user.level = newLevel;
      
      // Add level up badge
      user.badges = user.badges || [];
      user.badges.push({
        name: `Level ${newLevel} Achiever`,
        icon: '🎉',
        earnedAt: new Date(),
        description: `Reached level ${newLevel}`
      });
    }
    
    // Update stats based on reason
    if (reason === 'speaking') {
      user.totalSpeakingTime = (user.totalSpeakingTime || 0) + (amount * 60);
    } else if (reason === 'hosting') {
      user.totalRoomsHosted = (user.totalRoomsHosted || 0) + 1;
    } else if (reason === 'joining') {
      user.totalRoomsJoined = (user.totalRoomsJoined || 0) + 1;
    } else if (reason === 'listening') {
      user.totalListenTime = (user.totalListenTime || 0) + (amount * 60);
    }
    
    await user.save();
    
    res.json({
      success: true,
      xp: user.xp,
      level: user.level,
      levelUp,
      badges: user.badges,
      message: levelUp ? `Congratulations! You reached level ${newLevel}!` : `+${amount} XP earned!`
    });
  } catch (error) {
    console.error('Add XP error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
};

// @desc    Get leaderboards - ADD THIS
// @route   GET /api/users/leaderboards
export const getLeaderboards = async (req, res) => {
  try {
    const { type = 'xp', limit = 10 } = req.query;
    
    let sortField = '-xp';
    let selectFields = 'username fullName avatar xp level badges isCreator';
    
    if (type === 'rooms') {
      sortField = '-totalRoomsHosted';
    } else if (type === 'time') {
      sortField = '-totalSpeakingTime';
    } else if (type === 'followers') {
      sortField = '-followersCount';
    }
    
    const leaders = await User.find({ isActive: true })
      .select(selectFields)
      .sort(sortField)
      .limit(parseInt(limit));
    
    res.json({
      success: true,
      leaders,
      type,
      limit: parseInt(limit)
    });
  } catch (error) {
    console.error('Get leaderboards error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
};

// @desc    Get user rank - ADD THIS
// @route   GET /api/users/rank
export const getUserRank = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }
    
    const rank = await User.countDocuments({
      isActive: true,
      xp: { $gt: user.xp || 0 }
    }) + 1;
    
    res.json({
      success: true,
      rank
    });
  } catch (error) {
    console.error('Get user rank error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
};

// @desc    Get user stats - ADD THIS
// @route   GET /api/users/stats
export const getUserStats = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select('totalRoomsHosted totalRoomsJoined totalSpeakingTime totalListenTime xp level badges');
    
    res.json({
      success: true,
      totalJoined: user?.totalRoomsJoined || 0,
      totalHosted: user?.totalRoomsHosted || 0,
      hoursListened: Math.floor((user?.totalListenTime || 0) / 3600),
      hoursSpoken: Math.floor((user?.totalSpeakingTime || 0) / 3600),
      xp: user?.xp || 0,
      level: user?.level || 1,
      badges: user?.badges || []
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
};
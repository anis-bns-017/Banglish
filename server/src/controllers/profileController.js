import User from '../models/User.js';
import bcrypt from 'bcryptjs';

// @desc    Get my full profile
// @route   GET /api/profile/me
export const getMyProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select('-password -refreshToken -passwordResetToken -passwordResetExpires -emailVerificationToken')
      .populate('following', 'username fullName avatar bio isCreator')
      .populate('followers', 'username fullName avatar bio isCreator')
      .populate('badges')
      .populate('tickets.room', 'name category isMonetized')
      .populate('subscriptions.room', 'name category');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/profile/me
export const updateProfile = async (req, res) => {
  try {
    const { 
      fullName, 
      username, 
      bio, 
      avatar,
      nativeLanguage,
      learningLanguages,
      interests,
      notificationPreferences,
      creatorBio 
    } = req.body;
    
    const user = await User.findById(req.user.id);
    
    // Update basic fields
    if (fullName) user.fullName = fullName;
    if (username) user.username = username;
    if (bio !== undefined) user.bio = bio;
    if (avatar) user.avatar = avatar;
    
    // Update language preferences
    if (nativeLanguage) user.nativeLanguage = nativeLanguage;
    if (learningLanguages) user.learningLanguages = learningLanguages;
    
    // Update interests
    if (interests) user.interests = interests;
    
    // Update notification preferences
    if (notificationPreferences) {
      user.notificationPreferences = {
        ...user.notificationPreferences,
        ...notificationPreferences
      };
    }
    
    // Update creator bio (only if user is a creator)
    if (creatorBio !== undefined && user.isCreator) {
      user.creatorBio = creatorBio;
    }
    
    await user.save();
    
    // Return updated user with populated fields
    const updatedUser = await User.findById(user._id)
      .select('-password -refreshToken -passwordResetToken -passwordResetExpires -emailVerificationToken')
      .populate('following', 'username fullName avatar')
      .populate('followers', 'username fullName avatar');
    
    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Update profile error:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({ 
        success: false, 
        message: 'Username already taken' 
      });
    }

    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        success: false, 
        message: 'Validation Error', 
        errors: Object.values(error.errors).map(e => e.message)
      });
    }
    
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
};

// @desc    Change password
// @route   PUT /api/profile/change-password
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    const user = await User.findById(req.user.id).select('+password');
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }
    
    // Check current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ 
        success: false, 
        message: 'Current password is incorrect' 
      });
    }
    
    // Validate new password length
    if (newPassword.length < 6) {
      return res.status(400).json({ 
        success: false, 
        message: 'New password must be at least 6 characters' 
      });
    }
    
    // Update password
    user.password = newPassword;
    await user.save();
    
    // Add XP for security action
    await user.addXP(25);
    
    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
};

// @desc    Update interests
// @route   PUT /api/profile/interests
export const updateInterests = async (req, res) => {
  try {
    const { interests } = req.body;
    
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }
    
    user.interests = interests;
    await user.save();
    
    res.json({
      success: true,
      message: 'Interests updated successfully',
      interests: user.interests
    });
  } catch (error) {
    console.error('Update interests error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
};

// @desc    Update notification preferences
// @route   PUT /api/profile/notifications
export const updateNotifications = async (req, res) => {
  try {
    const { preferences } = req.body;
    
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }
    
    user.notificationPreferences = {
      ...user.notificationPreferences,
      ...preferences
    };
    
    await user.save();
    
    res.json({
      success: true,
      message: 'Notification preferences updated successfully',
      notificationPreferences: user.notificationPreferences
    });
  } catch (error) {
    console.error('Update notifications error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
};

// @desc    Update language preferences
// @route   PUT /api/profile/languages
export const updateLanguages = async (req, res) => {
  try {
    const { nativeLanguage, learningLanguages } = req.body;
    
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }
    
    if (nativeLanguage) user.nativeLanguage = nativeLanguage;
    if (learningLanguages) user.learningLanguages = learningLanguages;
    
    await user.save();
    
    res.json({
      success: true,
      message: 'Language preferences updated successfully',
      nativeLanguage: user.nativeLanguage,
      learningLanguages: user.learningLanguages
    });
  } catch (error) {
    console.error('Update languages error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
};

// @desc    Upload avatar
// @route   POST /api/profile/avatar
export const uploadAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: 'No file uploaded' 
      });
    }
    
    const user = await User.findById(req.user.id);
    
    // Assuming you're using cloud storage like Cloudinary
    const avatarUrl = req.file.path; // or req.file.cloudinary_url
    
    user.avatar = avatarUrl;
    await user.save();
    
    // Add XP for profile completion
    await user.addXP(15);
    
    res.json({
      success: true,
      message: 'Avatar uploaded successfully',
      avatar: user.avatar
    });
  } catch (error) {
    console.error('Upload avatar error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
};

// @desc    Get user stats
// @route   GET /api/profile/stats
export const getUserStats = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select('xp level badges totalRoomsHosted totalRoomsJoined totalSpeakingTime totalListenTime');
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }
    
    // Calculate next level XP requirement
    const nextLevelXP = (user.level * 100);
    const xpProgress = user.xp % 100;
    const xpNeeded = nextLevelXP - user.xp;
    
    res.json({
      success: true,
      stats: {
        level: user.level,
        xp: user.xp,
        nextLevelXP,
        xpProgress,
        xpNeeded: xpNeeded > 0 ? xpNeeded : 0,
        badges: user.badges,
        totalRoomsHosted: user.totalRoomsHosted,
        totalRoomsJoined: user.totalRoomsJoined,
        totalSpeakingTime: user.totalSpeakingTime,
        totalListenTime: user.totalListenTime
      }
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
};

// @desc    Get user by ID (public profile)
// @route   GET /api/profile/:userId
export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId)
      .select('username fullName avatar bio role createdAt nativeLanguage learningLanguages interests badges isCreator creatorBio totalRoomsHosted totalRoomsJoined')
      .populate('following', 'username fullName avatar isCreator')
      .populate('followers', 'username fullName avatar isCreator')
      .populate('badges');
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }
    
    // Get public stats only
    const publicStats = {
      totalRoomsHosted: user.totalRoomsHosted,
      totalRoomsJoined: user.totalRoomsJoined,
      level: user.level,
      badges: user.badges,
      nativeLanguage: user.nativeLanguage,
      learningLanguages: user.learningLanguages,
      interests: user.interests,
      isCreator: user.isCreator,
      creatorBio: user.creatorBio
    };
    
    res.json({
      success: true,
      user: {
        id: user._id,
        username: user.username,
        fullName: user.fullName,
        avatar: user.avatar,
        bio: user.bio,
        role: user.role,
        createdAt: user.createdAt,
        following: user.following,
        followers: user.followers,
        ...publicStats
      }
    });
  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
};

// @desc    Follow/Unfollow user
// @route   POST /api/profile/:userId/follow
export const toggleFollow = async (req, res) => {
  try {
    const targetUser = await User.findById(req.params.userId);
    const currentUser = await User.findById(req.user.id);
    
    if (!targetUser) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }
    
    if (targetUser._id.toString() === currentUser._id.toString()) {
      return res.status(400).json({ 
        success: false, 
        message: 'You cannot follow yourself' 
      });
    }
    
    const isFollowing = currentUser.following.includes(targetUser._id);
    
    if (isFollowing) {
      // Unfollow
      currentUser.following = currentUser.following.filter(
        id => id.toString() !== targetUser._id.toString()
      );
      targetUser.followers = targetUser.followers.filter(
        id => id.toString() !== currentUser._id.toString()
      );
    } else {
      // Follow
      currentUser.following.push(targetUser._id);
      targetUser.followers.push(currentUser._id);
      
      // Add XP for new follow
      await currentUser.addXP(5);
    }
    
    await Promise.all([currentUser.save(), targetUser.save()]);
    
    res.json({
      success: true,
      message: isFollowing ? 'Unfollowed successfully' : 'Followed successfully',
      isFollowing: !isFollowing
    });
  } catch (error) {
    console.error('Toggle follow error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
};
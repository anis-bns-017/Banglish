import User from '../models/User.js';

// @desc    Get all users (admin only)
// @route   GET /api/admin/users
export const getAllUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const { search, role, isActive, isCreator, sortBy } = req.query;

    // Build filter query
    let filter = {};
    
    if (search) {
      filter.$or = [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { fullName: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (role) filter.role = role;
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    if (isCreator !== undefined) filter.isCreator = isCreator === 'true';

    // Build sort options
    let sortOptions = {};
    switch(sortBy) {
      case 'newest':
        sortOptions = { createdAt: -1 };
        break;
      case 'oldest':
        sortOptions = { createdAt: 1 };
        break;
      case 'mostXp':
        sortOptions = { xp: -1 };
        break;
      case 'mostRooms':
        sortOptions = { totalRoomsHosted: -1 };
        break;
      default:
        sortOptions = { createdAt: -1 };
    }

    const users = await User.find(filter)
      .select('-password -refreshToken -passwordResetToken -passwordResetExpires -emailVerificationToken')
      .populate('following', 'username fullName')
      .populate('followers', 'username fullName')
      .skip(skip)
      .limit(limit)
      .sort(sortOptions);

    const total = await User.countDocuments(filter);

    // Get additional stats for each user
    const usersWithStats = users.map(user => ({
      id: user._id,
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      avatar: user.avatar,
      role: user.role,
      isActive: user.isActive,
      isCreator: user.isCreator,
      creatorApplication: user.creatorApplication,
      level: user.level,
      xp: user.xp,
      badges: user.badges.length,
      totalRoomsHosted: user.totalRoomsHosted,
      totalRoomsJoined: user.totalRoomsJoined,
      following: user.following.length,
      followers: user.followers.length,
      nativeLanguage: user.nativeLanguage,
      learningLanguages: user.learningLanguages,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt,
      lastActive: user.lastActive,
      totalEarnings: user.totalEarnings
    }));

    res.json({
      success: true,
      users: usersWithStats,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      filters: {
        role,
        isActive,
        isCreator,
        search
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
};

// @desc    Get user by ID (admin only)
// @route   GET /api/admin/users/:id
export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password -refreshToken -passwordResetToken -passwordResetExpires -emailVerificationToken')
      .populate('following', 'username fullName avatar email isCreator')
      .populate('followers', 'username fullName avatar email isCreator')
      .populate('badges')
      .populate('tickets.room', 'name category isMonetized createdAt')
      .populate('subscriptions.room', 'name category')
      .populate('payouts');

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    // Calculate additional stats
    const stats = {
      totalFollowing: user.following.length,
      totalFollowers: user.followers.length,
      totalBadges: user.badges.length,
      totalTickets: user.tickets.length,
      totalSubscriptions: user.subscriptions.length,
      totalPayouts: user.payouts.length,
      xpToNextLevel: (user.level * 100) - user.xp,
      accountAge: Math.floor((Date.now() - user.createdAt) / (1000 * 60 * 60 * 24)) // days
    };

    res.json({
      success: true,
      user: {
        ...user.toObject(),
        stats
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
};

// @desc    Update user (admin only)
// @route   PUT /api/admin/users/:id
export const updateUser = async (req, res) => {
  try {
    const { 
      username, 
      email, 
      fullName, 
      role, 
      isActive,
      nativeLanguage,
      learningLanguages,
      interests,
      isCreator,
      creatorApplication,
      xp,
      level,
      totalEarnings,
      notificationPreferences,
      emailVerified
    } = req.body;

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    // Update basic fields
    if (username) user.username = username;
    if (email) user.email = email;
    if (fullName) user.fullName = fullName;
    if (role) user.role = role;
    if (typeof isActive === 'boolean') user.isActive = isActive;
    if (typeof emailVerified === 'boolean') user.emailVerified = emailVerified;

    // Update language preferences
    if (nativeLanguage) user.nativeLanguage = nativeLanguage;
    if (learningLanguages) user.learningLanguages = learningLanguages;

    // Update interests
    if (interests) user.interests = interests;

    // Update creator status
    if (typeof isCreator === 'boolean') user.isCreator = isCreator;
    if (creatorApplication) {
      user.creatorApplication = {
        ...user.creatorApplication,
        ...creatorApplication,
        reviewedAt: creatorApplication.status ? new Date() : user.creatorApplication?.reviewedAt,
        reviewedBy: creatorApplication.status ? req.user.id : user.creatorApplication?.reviewedBy
      };
    }

    // Update gamification (admin override)
    if (xp !== undefined) user.xp = xp;
    if (level !== undefined) user.level = level;

    // Update earnings (admin override)
    if (totalEarnings !== undefined) user.totalEarnings = totalEarnings;

    // Update notification preferences
    if (notificationPreferences) {
      user.notificationPreferences = {
        ...user.notificationPreferences,
        ...notificationPreferences
      };
    }

    await user.save();

    // Return updated user with populated fields
    const updatedUser = await User.findById(user._id)
      .select('-password -refreshToken -passwordResetToken -passwordResetExpires -emailVerificationToken')
      .populate('following', 'username fullName')
      .populate('followers', 'username fullName');

    res.json({
      success: true,
      message: 'User updated successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Update user error:', error);
    
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({ 
        success: false, 
        message: `${field} already exists` 
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

// @desc    Delete user (admin only)
// @route   DELETE /api/admin/users/:id
export const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    // Prevent admin from deleting themselves
    if (user._id.toString() === req.user.id) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot delete your own account' 
      });
    }

    // Prevent deleting super admin if exists (optional)
    if (user.role === 'admin' && user.email === process.env.SUPER_ADMIN_EMAIL) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot delete super admin account' 
      });
    }

    await user.deleteOne();

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
};

// @desc    Get dashboard stats (admin only)
// @route   GET /api/admin/stats
export const getStats = async (req, res) => {
  try {
    const now = new Date();
    const today = new Date(now.setHours(0, 0, 0, 0));
    const thisWeek = new Date(now.setDate(now.getDate() - 7));
    const thisMonth = new Date(now.setMonth(now.getMonth() - 1));

    // Basic stats
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    const inactiveUsers = await User.countDocuments({ isActive: false });
    
    // Role stats
    const admins = await User.countDocuments({ role: 'admin' });
    const moderators = await User.countDocuments({ role: 'moderator' });
    const regularUsers = await User.countDocuments({ role: 'user' });

    // Creator stats
    const totalCreators = await User.countDocuments({ isCreator: true });
    const pendingCreators = await User.countDocuments({ 
      'creatorApplication.status': 'pending' 
    });
    const approvedCreators = await User.countDocuments({ 
      'creatorApplication.status': 'approved' 
    });
    const rejectedCreators = await User.countDocuments({ 
      'creatorApplication.status': 'rejected' 
    });

    // Email verification stats
    const verifiedEmails = await User.countDocuments({ emailVerified: true });
    const unverifiedEmails = await User.countDocuments({ emailVerified: false });

    // Time-based stats
    const newUsersToday = await User.countDocuments({
      createdAt: { $gte: today }
    });
    const newUsersThisWeek = await User.countDocuments({
      createdAt: { $gte: thisWeek }
    });
    const newUsersThisMonth = await User.countDocuments({
      createdAt: { $gte: thisMonth }
    });

    // Active users (last 24h, 7d, 30d)
    const activeLast24h = await User.countDocuments({
      lastActive: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    });
    const activeLast7d = await User.countDocuments({
      lastActive: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    });
    const activeLast30d = await User.countDocuments({
      lastActive: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
    });

    // Language stats
    const languageStats = await User.aggregate([
      { $group: { _id: "$nativeLanguage", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    // XP distribution
    const xpStats = await User.aggregate([
      {
        $bucket: {
          groupBy: "$xp",
          boundaries: [0, 100, 500, 1000, 5000, 10000],
          default: "10000+",
          output: {
            count: { $sum: 1 }
          }
        }
      }
    ]);

    // Level distribution
    const levelStats = await User.aggregate([
      {
        $bucket: {
          groupBy: "$level",
          boundaries: [1, 5, 10, 20, 30, 40, 50],
          default: "50+",
          output: {
            count: { $sum: 1 }
          }
        }
      }
    ]);

    // Earnings stats (for creators)
    const earningsStats = await User.aggregate([
      { $match: { isCreator: true } },
      {
        $group: {
          _id: null,
          totalEarnings: { $sum: "$totalEarnings" },
          availableBalance: { $sum: "$availableBalance" },
          pendingBalance: { $sum: "$pendingBalance" },
          avgEarnings: { $avg: "$totalEarnings" }
        }
      }
    ]);

    res.json({
      success: true,
      stats: {
        users: {
          total: totalUsers,
          active: activeUsers,
          inactive: inactiveUsers,
          byRole: {
            admin: admins,
            moderator: moderators,
            user: regularUsers
          },
          byVerification: {
            verified: verifiedEmails,
            unverified: unverifiedEmails
          }
        },
        creators: {
          total: totalCreators,
          pending: pendingCreators,
          approved: approvedCreators,
          rejected: rejectedCreators
        },
        activity: {
          newToday: newUsersToday,
          newThisWeek: newUsersThisWeek,
          newThisMonth: newUsersThisMonth,
          activeLast24h,
          activeLast7d,
          activeLast30d
        },
        languages: languageStats,
        gamification: {
          xpDistribution: xpStats,
          levelDistribution: levelStats
        },
        earnings: earningsStats[0] || {
          totalEarnings: 0,
          availableBalance: 0,
          pendingBalance: 0,
          avgEarnings: 0
        }
      }
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
};

// @desc    Review creator application
// @route   POST /api/admin/creators/review/:id
export const reviewCreatorApplication = async (req, res) => {
  try {
    const { status, notes } = req.body;
    const { id } = req.params;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status must be either approved or rejected'
      });
    }

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (!user.creatorApplication || user.creatorApplication.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'No pending creator application found'
      });
    }

    user.creatorApplication.status = status;
    user.creatorApplication.reviewedAt = new Date();
    user.creatorApplication.reviewedBy = req.user.id;
    user.creatorApplication.notes = notes || user.creatorApplication.notes;

    // If approved, grant creator status
    if (status === 'approved') {
      user.isCreator = true;
    }

    await user.save();

    res.json({
      success: true,
      message: `Creator application ${status}`,
      user: {
        id: user._id,
        username: user.username,
        isCreator: user.isCreator,
        creatorApplication: user.creatorApplication
      }
    });
  } catch (error) {
    console.error('Review creator application error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get all creator applications
// @route   GET /api/admin/creators/applications
export const getCreatorApplications = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const { status } = req.query;

    let filter = { creatorApplication: { $exists: true } };
    if (status) {
      filter['creatorApplication.status'] = status;
    }

    const users = await User.find(filter)
      .select('username email fullName avatar creatorApplication createdAt')
      .skip(skip)
      .limit(limit)
      .sort('-creatorApplication.submittedAt');

    const total = await User.countDocuments(filter);

    res.json({
      success: true,
      applications: users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get creator applications error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Toggle user active status (ban/unban)
// @route   PUT /api/admin/users/:id/toggle-status
export const toggleUserStatus = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Prevent admin from banning themselves
    if (user._id.toString() === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'Cannot change your own status'
      });
    }

    user.isActive = !user.isActive;
    await user.save();

    res.json({
      success: true,
      message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully`,
      isActive: user.isActive
    });
  } catch (error) {
    console.error('Toggle user status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};
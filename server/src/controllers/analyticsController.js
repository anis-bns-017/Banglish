import Room from '../models/Room.js';
import User from '../models/User.js';
import Transaction from '../models/Transaction.js';

// @desc    Get creator analytics dashboard
// @route   GET /api/analytics/creator
export const getCreatorAnalytics = async (req, res) => {
  try {
    const { timeframe = 'week' } = req.query;
    
    // Calculate date range based on timeframe
    const endDate = new Date();
    const startDate = new Date();
    
    switch(timeframe) {
      case 'day':
        startDate.setDate(startDate.getDate() - 1);
        break;
      case 'week':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case 'year':
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      default:
        startDate.setDate(startDate.getDate() - 7);
    }

    // Get creator's rooms
    const rooms = await Room.find({ 
      host: req.user.id,
      createdAt: { $gte: startDate, $lte: endDate }
    });

    // Calculate total listeners (unique users across all rooms)
    const uniqueListeners = new Set();
    rooms.forEach(room => {
      room.participants.forEach(p => uniqueListeners.add(p.user.toString()));
    });

    // Calculate total listening time
    let totalListeningTime = 0;
    rooms.forEach(room => {
      // This would come from actual tracking in production
      totalListeningTime += room.participantCount * 3600; // Placeholder
    });

    // Calculate revenue from transactions
    const transactions = await Transaction.find({
      to: req.user.id,
      createdAt: { $gte: startDate, $lte: endDate },
      status: 'completed'
    });

    const totalRevenue = transactions.reduce((sum, t) => sum + t.amount, 0);
    
    // Calculate growth percentages (compare with previous period)
    const prevStartDate = new Date(startDate);
    const prevEndDate = new Date(startDate);
    prevStartDate.setDate(prevStartDate.getDate() - (endDate - startDate) / (1000 * 60 * 60 * 24));
    
    const prevRooms = await Room.find({
      host: req.user.id,
      createdAt: { $gte: prevStartDate, $lte: prevEndDate }
    });
    
    const prevUniqueListeners = new Set();
    prevRooms.forEach(room => {
      room.participants.forEach(p => prevUniqueListeners.add(p.user.toString()));
    });
    
    const listenerGrowth = prevUniqueListeners.size > 0 
      ? ((uniqueListeners.size - prevUniqueListeners.size) / prevUniqueListeners.size) * 100 
      : 100;

    // Get listener history for chart
    const listenerHistory = [];
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const dayStr = currentDate.toISOString().split('T')[0];
      
      // Count listeners for this day
      const dayListeners = new Set();
      rooms.forEach(room => {
        if (room.createdAt.toISOString().split('T')[0] === dayStr) {
          room.participants.forEach(p => dayListeners.add(p.user.toString()));
        }
      });
      
      listenerHistory.push({
        date: dayStr,
        listeners: dayListeners.size
      });
      
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Category distribution
    const categoryDistribution = {};
    rooms.forEach(room => {
      categoryDistribution[room.category] = (categoryDistribution[room.category] || 0) + 1;
    });

    const categoryData = Object.entries(categoryDistribution).map(([name, value]) => ({
      name,
      value
    }));

    // Peak hours analysis
    const peakHours = Array(24).fill(0).map((_, i) => ({ hour: `${i}:00`, listeners: 0 }));
    // This would use actual join/leave timestamps in production

    // Top performing rooms
    const topRooms = rooms
      .map(room => ({
        _id: room._id,
        name: room.name,
        category: room.category,
        totalListeners: room.participantCount,
        avgListenTime: 45, // Placeholder - would be calculated from actual data
        peakListeners: room.peakParticipants || room.participantCount,
        revenue: transactions
          .filter(t => t.room?.toString() === room._id.toString())
          .reduce((sum, t) => sum + t.amount, 0)
      }))
      .sort((a, b) => b.totalListeners - a.totalListeners)
      .slice(0, 5);

    // Return rate (users who came back)
    // This is simplified - would need more sophisticated tracking
    const returnRate = uniqueListeners.size > 0 ? 65 : 0;

    // Speaker-to-listener ratio
    let totalSpeakers = 0;
    let totalParticipants = 0;
    rooms.forEach(room => {
      const speakers = room.participants.filter(p => p.role === 'speaker' || p.role === 'host').length;
      totalSpeakers += speakers;
      totalParticipants += room.participantCount;
    });
    const speakerRatio = totalParticipants > 0 ? (totalSpeakers / totalParticipants) * 100 : 0;

    res.json({
      success: true,
      totalListeners: uniqueListeners.size,
      listenerGrowth: Math.round(listenerGrowth * 10) / 10,
      totalListeningTime,
      avgListeningTime: uniqueListeners.size > 0 
        ? Math.round(totalListeningTime / uniqueListeners.size / 60) 
        : 0,
      totalRooms: rooms.length,
      activeRooms: rooms.filter(r => r.isActive).length,
      totalRevenue,
      revenueGrowth: 15, // Placeholder - would calculate from previous period
      listenerHistory,
      categoryDistribution: categoryData,
      peakHours,
      returnRate,
      speakerRatio: Math.round(speakerRatio * 10) / 10,
      avgListenTime: 35, // Placeholder
      topRooms
    });

  } catch (error) {
    console.error('Creator analytics error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get room-specific analytics
// @route   GET /api/analytics/room/:roomId
export const getRoomAnalytics = async (req, res) => {
  try {
    const room = await Room.findById(req.params.roomId)
      .populate('participants.user', 'username');

    if (!room) {
      return res.status(404).json({ success: false, message: 'Room not found' });
    }

    // Check if user has access (host, moderator, or admin)
    const isHost = room.host.toString() === req.user.id;
    const isModerator = room.moderators?.some(m => m.toString() === req.user.id);
    const isAdmin = req.user.role === 'admin';

    if (!isHost && !isModerator && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    // Calculate analytics
    const analytics = {
      roomId: room._id,
      name: room.name,
      createdAt: room.createdAt,
      totalParticipants: room.participantCount,
      peakParticipants: room.peakParticipants || room.participantCount,
      averageListenTime: 25, // Placeholder - would come from tracking
      participantList: room.participants.map(p => ({
        username: p.user?.username,
        joinedAt: p.joinedAt,
        role: p.role,
        speakingTime: 0 // Placeholder
      })),
      engagement: {
        handRaised: room.participants.filter(p => p.handRaised).length,
        speakers: room.participants.filter(p => p.role === 'speaker' || p.role === 'host').length,
        listeners: room.participants.filter(p => p.role === 'listener').length
      }
    };

    res.json({
      success: true,
      analytics
    });

  } catch (error) {
    console.error('Room analytics error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get user analytics (for profile)
// @route   GET /api/analytics/user/:userId
export const getUserAnalytics = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Get user's room participation
    const roomsJoined = await Room.find({
      'participants.user': user._id
    }).select('name category createdAt');

    const roomsHosted = await Room.find({
      host: user._id
    }).select('name category createdAt participantCount');

    const analytics = {
      userId: user._id,
      username: user.username,
      fullName: user.fullName,
      joinedAt: user.createdAt,
      stats: {
        xp: user.xp || 0,
        level: user.level || 1,
        totalRoomsJoined: roomsJoined.length,
        totalRoomsHosted: roomsHosted.length,
        totalSpeakingTime: user.totalSpeakingTime || 0,
        totalListenTime: user.totalListenTime || 0,
        badges: user.badges || []
      },
      recentActivity: [
        ...roomsJoined.slice(0, 5).map(r => ({
          type: 'joined',
          room: r.name,
          category: r.category,
          date: r.createdAt
        })),
        ...roomsHosted.slice(0, 5).map(r => ({
          type: 'hosted',
          room: r.name,
          category: r.category,
          participants: r.participantCount,
          date: r.createdAt
        }))
      ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 10)
    };

    res.json({
      success: true,
      analytics
    });

  } catch (error) {
    console.error('User analytics error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get platform analytics (admin only)
// @route   GET /api/analytics/platform
export const getPlatformAnalytics = async (req, res) => {
  try {
    const { timeframe = 'month' } = req.query;

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    
    switch(timeframe) {
      case 'day':
        startDate.setDate(startDate.getDate() - 1);
        break;
      case 'week':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case 'year':
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      default:
        startDate.setMonth(startDate.getMonth() - 1);
    }

    // Get counts
    const [
      totalUsers,
      newUsers,
      activeUsers,
      totalRooms,
      activeRooms,
      totalRevenue,
      platformFee
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ createdAt: { $gte: startDate } }),
      User.countDocuments({ lastActive: { $gte: new Date(Date.now() - 24*60*60*1000) } }),
      Room.countDocuments(),
      Room.countDocuments({ isActive: true }),
      Transaction.aggregate([
        { $match: { status: 'completed', createdAt: { $gte: startDate } } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      Transaction.aggregate([
        { $match: { status: 'completed', createdAt: { $gte: startDate } } },
        { $group: { _id: null, total: { $sum: '$platformFee' } } }
      ])
    ]);

    // Growth rates
    const prevStartDate = new Date(startDate);
    prevStartDate.setDate(prevStartDate.getDate() - (endDate - startDate) / (1000 * 60 * 60 * 24));
    
    const prevNewUsers = await User.countDocuments({ 
      createdAt: { $gte: prevStartDate, $lte: startDate } 
    });

    const userGrowth = prevNewUsers > 0 
      ? ((newUsers - prevNewUsers) / prevNewUsers) * 100 
      : 100;

    // Room categories distribution
    const categories = await Room.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    const categoryDistribution = categories.map(c => ({
      name: c._id,
      value: c.count
    }));

    res.json({
      success: true,
      overview: {
        totalUsers,
        newUsers,
        activeUsers,
        userGrowth: Math.round(userGrowth * 10) / 10,
        totalRooms,
        activeRooms,
        totalRevenue: totalRevenue[0]?.total || 0,
        platformFee: platformFee[0]?.total || 0
      },
      categories: categoryDistribution,
      timeframe
    });

  } catch (error) {
    console.error('Platform analytics error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get engagement metrics
// @route   GET /api/analytics/engagement
export const getEngagementMetrics = async (req, res) => {
  try {
    const { roomId } = req.query;

    const query = roomId ? { _id: roomId } : {};
    const rooms = await Room.find(query).select('participants participantCount');

    let totalParticipants = 0;
    let totalSpeakers = 0;
    let totalHandRaised = 0;
    let totalMuted = 0;

    rooms.forEach(room => {
      totalParticipants += room.participantCount;
      totalSpeakers += room.participants.filter(p => p.role === 'speaker' || p.role === 'host').length;
      totalHandRaised += room.participants.filter(p => p.handRaised).length;
      totalMuted += room.participants.filter(p => p.isMuted).length;
    });

    const metrics = {
      avgParticipantsPerRoom: rooms.length > 0 ? totalParticipants / rooms.length : 0,
      speakerRatio: totalParticipants > 0 ? (totalSpeakers / totalParticipants) * 100 : 0,
      handRaiseRatio: totalParticipants > 0 ? (totalHandRaised / totalParticipants) * 100 : 0,
      muteRatio: totalParticipants > 0 ? (totalMuted / totalParticipants) * 100 : 0,
      totalRooms: rooms.length
    };

    res.json({
      success: true,
      metrics
    });

  } catch (error) {
    console.error('Engagement metrics error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get revenue analytics
// @route   GET /api/analytics/revenue
export const getRevenueAnalytics = async (req, res) => {
  try {
    const { timeframe = 'month' } = req.query;

    const endDate = new Date();
    const startDate = new Date();
    
    switch(timeframe) {
      case 'day':
        startDate.setDate(startDate.getDate() - 1);
        break;
      case 'week':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case 'year':
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
    }

    const transactions = await Transaction.find({
      $or: [
        { from: req.user.id },
        { to: req.user.id }
      ],
      createdAt: { $gte: startDate, $lte: endDate },
      status: 'completed'
    }).populate('room', 'name');

    // Group by type
    const byType = {
      ticket: { count: 0, amount: 0 },
      subscription: { count: 0, amount: 0 },
      donation: { count: 0, amount: 0 }
    };

    transactions.forEach(t => {
      if (byType[t.type]) {
        byType[t.type].count++;
        byType[t.type].amount += t.amount;
      }
    });

    // Daily breakdown
    const dailyData = [];
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const dayStr = currentDate.toISOString().split('T')[0];
      const dayTransactions = transactions.filter(t => 
        t.createdAt.toISOString().split('T')[0] === dayStr
      );
      
      dailyData.push({
        date: dayStr,
        amount: dayTransactions.reduce((sum, t) => sum + t.amount, 0),
        count: dayTransactions.length
      });
      
      currentDate.setDate(currentDate.getDate() + 1);
    }

    res.json({
      success: true,
      summary: {
        totalRevenue: transactions.reduce((sum, t) => sum + t.amount, 0),
        totalTransactions: transactions.length,
        averageTransaction: transactions.length > 0 
          ? transactions.reduce((sum, t) => sum + t.amount, 0) / transactions.length 
          : 0
      },
      byType,
      dailyData,
      recentTransactions: transactions.slice(0, 10)
    });

  } catch (error) {
    console.error('Revenue analytics error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
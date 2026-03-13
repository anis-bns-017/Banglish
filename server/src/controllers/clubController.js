import Club from '../models/Club.js';
import User from '../models/User.js';
import Room from '../models/Room.js';

// @desc    Create a new club
// @route   POST /api/clubs
export const createClub = async (req, res) => {
  try {
    const {
      name,
      description,
      category,
      isPrivate,
      requiresApproval,
      tags,
      rules
    } = req.body;

    const club = await Club.create({
      name,
      description,
      category,
      isPrivate,
      requiresApproval,
      tags,
      rules,
      createdBy: req.user.id,
      admins: [req.user.id],
      members: [{
        user: req.user.id,
        role: 'admin',
        status: 'active'
      }]
    });

    res.status(201).json({
      success: true,
      message: 'Club created successfully',
      club
    });
  } catch (error) {
    console.error('Create club error:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Club name already exists'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get all clubs
// @route   GET /api/clubs
export const getClubs = async (req, res) => {
  try {
    const {
      category,
      search,
      page = 1,
      limit = 20
    } = req.query;

    const query = { isActive: true };
    
    if (category) query.category = category;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [search] } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const clubs = await Club.find(query)
      .populate('createdBy', 'username fullName avatar')
      .populate('members.user', 'username avatar')
      .sort('-memberCount')
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Club.countDocuments(query);

    res.json({
      success: true,
      clubs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get clubs error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get club by ID
// @route   GET /api/clubs/:clubId
export const getClubById = async (req, res) => {
  try {
    const club = await Club.findById(req.params.clubId)
      .populate('createdBy', 'username fullName avatar')
      .populate('admins', 'username fullName avatar')
      .populate('moderators', 'username fullName avatar')
      .populate('members.user', 'username fullName avatar')
      .populate('rooms', 'name participantCount isActive');

    if (!club) {
      return res.status(404).json({
        success: false,
        message: 'Club not found'
      });
    }

    // Check if user is member
    const isMember = club.members.some(m => 
      m.user._id.toString() === req.user.id && m.status === 'active'
    );

    // If private and not member, hide member list
    if (club.isPrivate && !isMember && req.user.role !== 'admin') {
      club.members = [];
    }

    res.json({
      success: true,
      club,
      isMember,
      userRole: club.members.find(m => m.user._id.toString() === req.user.id)?.role
    });
  } catch (error) {
    console.error('Get club error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Join a club
// @route   POST /api/clubs/:clubId/join
export const joinClub = async (req, res) => {
  try {
    const club = await Club.findById(req.params.clubId);

    if (!club) {
      return res.status(404).json({
        success: false,
        message: 'Club not found'
      });
    }

    // Check if already a member
    const existingMember = club.members.find(m => 
      m.user.toString() === req.user.id
    );

    if (existingMember) {
      if (existingMember.status === 'active') {
        return res.status(400).json({
          success: false,
          message: 'Already a member of this club'
        });
      } else if (existingMember.status === 'pending') {
        return res.status(400).json({
          success: false,
          message: 'Membership request already pending'
        });
      }
    }

    // Determine status based on club settings
    const status = club.requiresApproval ? 'pending' : 'active';

    club.members.push({
      user: req.user.id,
      role: 'member',
      status
    });

    await club.save();

    res.json({
      success: true,
      message: status === 'pending' 
        ? 'Membership request sent' 
        : 'Successfully joined club',
      status
    });
  } catch (error) {
    console.error('Join club error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Leave a club
// @route   POST /api/clubs/:clubId/leave
export const leaveClub = async (req, res) => {
  try {
    const club = await Club.findById(req.params.clubId);

    if (!club) {
      return res.status(404).json({
        success: false,
        message: 'Club not found'
      });
    }

    // Remove member
    club.members = club.members.filter(m => 
      m.user.toString() !== req.user.id
    );

    // Remove from roles if applicable
    club.admins = club.admins.filter(a => a.toString() !== req.user.id);
    club.moderators = club.moderators.filter(m => m.toString() !== req.user.id);

    await club.save();

    res.json({
      success: true,
      message: 'Left club successfully'
    });
  } catch (error) {
    console.error('Leave club error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Approve member (admin/moderator only)
// @route   POST /api/clubs/:clubId/approve/:userId
export const approveMember = async (req, res) => {
  try {
    const club = await Club.findById(req.params.clubId);

    if (!club) {
      return res.status(404).json({
        success: false,
        message: 'Club not found'
      });
    }

    // Check if user has permission
    const isAdmin = club.admins.some(a => a.toString() === req.user.id);
    const isModerator = club.moderators.some(m => m.toString() === req.user.id);

    if (!isAdmin && !isModerator) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    // Find and approve member
    const member = club.members.find(m => 
      m.user.toString() === req.params.userId
    );

    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'Member not found'
      });
    }

    member.status = 'active';
    await club.save();

    res.json({
      success: true,
      message: 'Member approved'
    });
  } catch (error) {
    console.error('Approve member error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Create club room
// @route   POST /api/clubs/:clubId/rooms
export const createClubRoom = async (req, res) => {
  try {
    const club = await Club.findById(req.params.clubId);

    if (!club) {
      return res.status(404).json({
        success: false,
        message: 'Club not found'
      });
    }

    // Check if user has permission
    const isAdmin = club.admins.some(a => a.toString() === req.user.id);
    const isModerator = club.moderators.some(m => m.toString() === req.user.id);

    if (!isAdmin && !isModerator) {
      return res.status(403).json({
        success: false,
        message: 'Only admins and moderators can create rooms'
      });
    }

    const {
      name,
      description,
      category,
      isPrivate,
      maxParticipants
    } = req.body;

    // Create room
    const room = await Room.create({
      name,
      description,
      category: category || club.category,
      host: req.user.id,
      club: club._id,
      isPrivate: isPrivate || false,
      maxParticipants: maxParticipants || 50,
      participants: [{
        user: req.user.id,
        role: 'host'
      }]
    });

    // Add room to club
    club.rooms.push(room._id);
    club.totalRooms += 1;
    await club.save();

    res.status(201).json({
      success: true,
      message: 'Room created successfully',
      room
    });
  } catch (error) {
    console.error('Create club room error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
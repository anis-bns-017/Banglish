import Room from '../models/Room.js';
import User from '../models/User.js';
import bcrypt from 'bcryptjs';

// @desc    Create a new room
// @route   POST /api/rooms
export const createRoom = async (req, res) => {
  try {
    const {
      name,
      description,
      category,
      language,
      isPrivate,
      password,
      maxParticipants,
      tags,
      image
    } = req.body;

    // Hash password if private room
    let hashedPassword = null;
    if (isPrivate && password) {
      const salt = await bcrypt.genSalt(10);
      hashedPassword = await bcrypt.hash(password, salt);
    }

    const room = await Room.create({
      name,
      description,
      category,
      language,
      isPrivate,
      password: hashedPassword,
      host: req.user.id,
      moderators: [req.user.id],
      maxParticipants,
      tags,
      image,
      participants: [{
        user: req.user.id,
        role: 'host',
        isMuted: false
      }]
    });

    // Populate participant info
    await room.populate('participants.user', 'username fullName avatar');

    res.status(201).json({
      success: true,
      message: 'Room created successfully',
      room
    });
  } catch (error) {
    console.error('Create room error:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        success: false, 
        message: 'Validation Error', 
        errors: Object.values(error.errors).map(e => e.message)
      });
    }

    res.status(500).json({ 
      success: false, 
      message: 'Server error while creating room' 
    });
  }
};

// @desc    Get all rooms (with filters)
// @route   GET /api/rooms
export const getRooms = async (req, res) => {
  try {
    const {
      category,
      language,
      search,
      page = 1,
      limit = 20,
      sort = '-participantCount'
    } = req.query;

    const query = { isActive: true };

    // Apply filters
    if (category) query.category = category;
    if (language) query.language = language;
    if (search) {
      query.$text = { $search: search };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const rooms = await Room.find(query)
      .populate('host', 'username fullName avatar')
      .populate('participants.user', 'username fullName avatar')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Room.countDocuments(query);

    res.json({
      success: true,
      rooms,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get rooms error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
};

// @desc    Get room by ID
// @route   GET /api/rooms/:roomId
export const getRoomById = async (req, res) => {
  try {
    const room = await Room.findById(req.params.roomId)
      .populate('host', 'username fullName avatar bio')
      .populate('moderators', 'username fullName avatar')
      .populate('participants.user', 'username fullName avatar');

    if (!room) {
      return res.status(404).json({ 
        success: false, 
        message: 'Room not found' 
      });
    }

    res.json({
      success: true,
      room
    });
  } catch (error) {
    console.error('Get room error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
};

// @desc    Join a room
// @route   POST /api/rooms/:roomId/join
export const joinRoom = async (req, res) => {
  try {
    const { password } = req.body;
    const room = await Room.findById(req.params.roomId);

    if (!room) {
      return res.status(404).json({ 
        success: false, 
        message: 'Room not found' 
      });
    }

    // Check if room is full
    if (room.participants.length >= room.maxParticipants) {
      return res.status(400).json({ 
        success: false, 
        message: 'Room is full' 
      });
    }

    // Check if user is already in room
    const alreadyJoined = room.participants.some(
      p => p.user.toString() === req.user.id
    );

    if (alreadyJoined) {
      return res.status(400).json({ 
        success: false, 
        message: 'You are already in this room' 
      });
    }

    // Verify password for private rooms
    if (room.isPrivate) {
      if (!password) {
        return res.status(400).json({ 
          success: false, 
          message: 'Password is required for this room' 
        });
      }

      const isMatch = await bcrypt.compare(password, room.password);
      if (!isMatch) {
        return res.status(401).json({ 
          success: false, 
          message: 'Incorrect password' 
        });
      }
    }

    // Add user to participants
    room.participants.push({
      user: req.user.id,
      role: 'listener',
      joinedAt: new Date()
    });

    await room.save();
    await room.populate('participants.user', 'username fullName avatar');

    res.json({
      success: true,
      message: 'Joined room successfully',
      room
    });
  } catch (error) {
    console.error('Join room error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
};

// @desc    Leave a room
// @route   POST /api/rooms/:roomId/leave
export const leaveRoom = async (req, res) => {
  try {
    const room = await Room.findById(req.params.roomId);

    if (!room) {
      return res.status(404).json({ 
        success: false, 
        message: 'Room not found' 
      });
    }

    // Remove user from participants
    room.participants = room.participants.filter(
      p => p.user.toString() !== req.user.id
    );

    // If host leaves, assign new host or close room
    if (room.host.toString() === req.user.id) {
      if (room.participants.length > 0) {
        // Assign new host (first participant)
        room.host = room.participants[0].user;
        room.participants[0].role = 'host';
      } else {
        // Close room if no participants left
        room.isActive = false;
      }
    }

    await room.save();

    res.json({
      success: true,
      message: 'Left room successfully',
      roomId: room._id
    });
  } catch (error) {
    console.error('Leave room error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
};

// @desc    Update room (host only)
// @route   PUT /api/rooms/:roomId
export const updateRoom = async (req, res) => {
  try {
    const room = await Room.findById(req.params.roomId);

    if (!room) {
      return res.status(404).json({ 
        success: false, 
        message: 'Room not found' 
      });
    }

    // Check if user is host
    if (room.host.toString() !== req.user.id) {
      return res.status(403).json({ 
        success: false, 
        message: 'Only host can update room' 
      });
    }

    const {
      name,
      description,
      category,
      language,
      isPrivate,
      password,
      maxParticipants,
      tags,
      image
    } = req.body;

    // Update fields
    if (name) room.name = name;
    if (description !== undefined) room.description = description;
    if (category) room.category = category;
    if (language) room.language = language;
    if (typeof isPrivate === 'boolean') room.isPrivate = isPrivate;
    if (password) {
      const salt = await bcrypt.genSalt(10);
      room.password = await bcrypt.hash(password, salt);
    }
    if (maxParticipants) room.maxParticipants = maxParticipants;
    if (tags) room.tags = tags;
    if (image) room.image = image;

    await room.save();

    res.json({
      success: true,
      message: 'Room updated successfully',
      room
    });
  } catch (error) {
    console.error('Update room error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
};

// @desc    Delete room (host only)
// @route   DELETE /api/rooms/:roomId
export const deleteRoom = async (req, res) => {
  try {
    const room = await Room.findById(req.params.roomId);

    if (!room) {
      return res.status(404).json({ 
        success: false, 
        message: 'Room not found' 
      });
    }

    // Check if user is host
    if (room.host.toString() !== req.user.id) {
      return res.status(403).json({ 
        success: false, 
        message: 'Only host can delete room' 
      });
    }

    await room.deleteOne();

    res.json({
      success: true,
      message: 'Room deleted successfully'
    });
  } catch (error) {
    console.error('Delete room error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
};

// @desc    Moderate room (host/moderator actions)
// @route   POST /api/rooms/:roomId/moderate
export const moderateRoom = async (req, res) => {
  try {
    const { action, userId } = req.body;
    const room = await Room.findById(req.params.roomId);

    if (!room) {
      return res.status(404).json({ 
        success: false, 
        message: 'Room not found' 
      });
    }

    // Check if user is host or moderator
    const isHost = room.host.toString() === req.user.id;
    const isModerator = room.moderators.some(m => m.toString() === req.user.id);

    if (!isHost && !isModerator) {
      return res.status(403).json({ 
        success: false, 
        message: 'Only host and moderators can perform this action' 
      });
    }

    const participantIndex = room.participants.findIndex(
      p => p.user.toString() === userId
    );

    if (participantIndex === -1) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found in room' 
      });
    }

    switch (action) {
      case 'mute':
        room.participants[participantIndex].isMuted = true;
        break;
      case 'unmute':
        room.participants[participantIndex].isMuted = false;
        break;
      case 'make-speaker':
        room.participants[participantIndex].role = 'speaker';
        break;
      case 'make-listener':
        room.participants[participantIndex].role = 'listener';
        break;
      case 'make-moderator':
        if (isHost) {
          room.participants[participantIndex].role = 'moderator';
          room.moderators.push(userId);
        } else {
          return res.status(403).json({ 
            success: false, 
            message: 'Only host can assign moderators' 
          });
        }
        break;
      case 'remove':
        room.participants.splice(participantIndex, 1);
        break;
      default:
        return res.status(400).json({ 
          success: false, 
          message: 'Invalid action' 
        });
    }

    await room.save();

    res.json({
      success: true,
      message: `Action '${action}' performed successfully`,
      room
    });
  } catch (error) {
    console.error('Moderate room error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
};

// @desc    Get personalized room recommendations
// @route   GET /api/rooms/recommendations
export const getRecommendations = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    // Build recommendation query based on user interests and history
    const query = {
      isActive: true,
      $or: [
        { category: { $in: user.interests } },
        { tags: { $in: user.interests } },
        { topics: { $in: user.interests } }
      ]
    };
    
    // Language learning recommendations
    if (user.learningLanguages?.length) {
      const languages = user.learningLanguages.map(l => l.language);
      query.$or.push({ targetLanguages: { $in: languages } });
    }
    
    const rooms = await Room.find(query)
      .populate('host', 'username fullName avatar level badges')
      .sort('-popularityScore')
      .limit(10);
    
    res.json({
      success: true,
      recommendations: rooms
    });
  } catch (error) {
    console.error('Recommendations error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Create a poll in room
// @route   POST /api/rooms/:roomId/polls
export const createPoll = async (req, res) => {
  try {
    const { question, options, duration } = req.body;
    const room = await Room.findById(req.params.roomId);
    
    if (!room) {
      return res.status(404).json({ success: false, message: 'Room not found' });
    }
    
    // Check if user is host or moderator
    const isHost = room.host.toString() === req.user.id;
    const isModerator = room.moderators.includes(req.user.id);
    
    if (!isHost && !isModerator) {
      return res.status(403).json({ success: false, message: 'Only hosts and moderators can create polls' });
    }
    
    const poll = {
      question,
      options: options.map(opt => ({ text: opt, votes: [] })),
      createdBy: req.user.id,
      createdAt: new Date(),
      endsAt: new Date(Date.now() + (duration * 60 * 1000)),
      isActive: true
    };
    
    room.polls.push(poll);
    await room.save();
    
    // Emit socket event
    const io = getIO();
    io.to(req.params.roomId).emit('new-poll', poll);
    
    res.json({ success: true, poll });
  } catch (error) {
    console.error('Create poll error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Vote in a poll
// @route   POST /api/rooms/:roomId/polls/:pollId/vote
export const votePoll = async (req, res) => {
  try {
    const { optionIndex } = req.body;
    const room = await Room.findById(req.params.roomId);
    
    if (!room) {
      return res.status(404).json({ success: false, message: 'Room not found' });
    }
    
    const poll = room.polls.id(req.params.pollId);
    
    if (!poll || !poll.isActive) {
      return res.status(404).json({ success: false, message: 'Poll not found or expired' });
    }
    
    if (poll.endsAt < new Date()) {
      poll.isActive = false;
      await room.save();
      return res.status(400).json({ success: false, message: 'Poll has ended' });
    }
    
    // Remove previous vote if any
    poll.options.forEach(opt => {
      opt.votes = opt.votes.filter(v => v.toString() !== req.user.id);
    });
    
    // Add new vote
    poll.options[optionIndex].votes.push(req.user.id);
    await room.save();
    
    // Emit updated results
    const io = getIO();
    io.to(req.params.roomId).emit('poll-update', {
      pollId: req.params.pollId,
      results: poll.options.map(opt => ({
        text: opt.text,
        votes: opt.votes.length
      }))
    });
    
    res.json({ success: true });
  } catch (error) {
    console.error('Vote poll error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Request to speak
// @route   POST /api/rooms/:roomId/request-speak
export const requestToSpeak = async (req, res) => {
  try {
    const { topic } = req.body;
    const room = await Room.findById(req.params.roomId);
    
    if (!room) {
      return res.status(404).json({ success: false, message: 'Room not found' });
    }
    
    // Check if already in queue
    const alreadyInQueue = room.speakerQueue.some(
      q => q.user.toString() === req.user.id
    );
    
    if (alreadyInQueue) {
      return res.status(400).json({ success: false, message: 'Already in queue' });
    }
    
    room.speakerQueue.push({
      user: req.user.id,
      requestedAt: new Date(),
      topic
    });
    
    await room.save();
    
    // Notify moderators
    const io = getIO();
    io.to(req.params.roomId).emit('speaker-request', {
      userId: req.user.id,
      username: req.user.username,
      topic
    });
    
    res.json({ success: true, message: 'Added to speaker queue' });
  } catch (error) {
    console.error('Request to speak error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Schedule a room
// @route   POST /api/rooms/schedule
export const scheduleRoom = async (req, res) => {
  try {
    const {
      name,
      description,
      category,
      scheduledFor,
      scheduledEnd,
      recurring,
      targetLanguages,
      isLanguageExchange,
      ticketPrice,
      maxParticipants
    } = req.body;
    
    const room = await Room.create({
      name,
      description,
      category,
      scheduledFor,
      scheduledEnd,
      recurring,
      targetLanguages,
      isLanguageExchange,
      ticketPrice: ticketPrice || 0,
      maxParticipants,
      host: req.user.id,
      moderators: [req.user.id],
      roomType: 'scheduled',
      isActive: false // Scheduled rooms start inactive
    });
    
    res.status(201).json({
      success: true,
      message: 'Room scheduled successfully',
      room
    });
  } catch (error) {
    console.error('Schedule room error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get trending topics
// @route   GET /api/rooms/trending/topics
export const getTrendingTopics = async (req, res) => {
  try {
    const trending = await Room.aggregate([
      { $match: { isActive: true, createdAt: { $gte: new Date(Date.now() - 7*24*60*60*1000) } } },
      { $unwind: '$topics' },
      { $group: { _id: '$topics', count: { $sum: 1 }, totalParticipants: { $sum: '$participantCount' } } },
      { $sort: { count: -1, totalParticipants: -1 } },
      { $limit: 20 }
    ]);
    
    res.json({ success: true, trending });
  } catch (error) {
    console.error('Trending topics error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
import Event from '../models/Event.js';
import Club from '../models/Club.js';
import { sendPushNotification } from '../services/notificationService.js';

// @desc    Create event
// @route   POST /api/events
export const createEvent = async (req, res) => {
  try {
    const {
      title,
      description,
      clubId,
      roomId,
      startDate,
      endDate,
      timezone,
      recurring,
      type,
      maxAttendees,
      reminders
    } = req.body;

    // Check if user has permission (club admin/moderator)
    const club = await Club.findById(clubId);
    if (!club) {
      return res.status(404).json({
        success: false,
        message: 'Club not found'
      });
    }

    const isAdmin = club.admins.some(a => a.toString() === req.user.id);
    const isModerator = club.moderators.some(m => m.toString() === req.user.id);

    if (!isAdmin && !isModerator) {
      return res.status(403).json({
        success: false,
        message: 'Only admins and moderators can create events'
      });
    }

    const event = await Event.create({
      title,
      description,
      club: clubId,
      room: roomId,
      createdBy: req.user.id,
      startDate,
      endDate,
      timezone,
      recurring,
      type,
      maxAttendees,
      reminders: reminders || [{ type: 'push', time: 60 }]
    });

    // Update club stats
    club.totalEvents += 1;
    await club.save();

    // Notify club members
    const members = club.members.filter(m => m.status === 'active');
    for (const member of members) {
      await sendPushNotification(member.user, {
        title: `New Event: ${title}`,
        body: `${club.name} has created a new event`,
        data: { eventId: event._id, clubId }
      });
    }

    res.status(201).json({
      success: true,
      message: 'Event created successfully',
      event
    });
  } catch (error) {
    console.error('Create event error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get events
// @route   GET /api/events
export const getEvents = async (req, res) => {
  try {
    const {
      clubId,
      upcoming,
      page = 1,
      limit = 20
    } = req.query;

    const query = { isActive: true };
    
    if (clubId) query.club = clubId;
    if (upcoming === 'true') {
      query.startDate = { $gte: new Date() };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const events = await Event.find(query)
      .populate('club', 'name avatar')
      .populate('createdBy', 'username fullName')
      .populate('room', 'name')
      .sort('startDate')
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Event.countDocuments(query);

    res.json({
      success: true,
      events,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get events error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    RSVP to event
// @route   POST /api/events/:eventId/rsvp
export const rsvpEvent = async (req, res) => {
  try {
    const { status } = req.body; // 'going', 'interested', 'not_going'
    
    const event = await Event.findById(req.params.eventId);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Check if already RSVP'd
    const existingRSVP = event.attendees.find(a => 
      a.user.toString() === req.user.id
    );

    if (existingRSVP) {
      existingRSVP.status = status;
      existingRSVP.joinedAt = new Date();
    } else {
      // Check capacity
      if (event.maxAttendees > 0 && event.attendeeCount >= event.maxAttendees) {
        return res.status(400).json({
          success: false,
          message: 'Event is full'
        });
      }

      event.attendees.push({
        user: req.user.id,
        status
      });
    }

    await event.save();

    res.json({
      success: true,
      message: 'RSVP updated successfully'
    });
  } catch (error) {
    console.error('RSVP error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get user's upcoming events
// @route   GET /api/events/my-events
export const getMyEvents = async (req, res) => {
  try {
    const events = await Event.find({
      'attendees.user': req.user.id,
      startDate: { $gte: new Date() }
    })
    .populate('club', 'name avatar')
    .populate('room', 'name')
    .sort('startDate')
    .limit(10);

    res.json({
      success: true,
      events
    });
  } catch (error) {
    console.error('Get my events error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
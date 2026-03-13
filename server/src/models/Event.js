import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Event title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  description: {
    type: String,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  club: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Club',
    required: true
  },
  room: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Event timing
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  timezone: {
    type: String,
    default: 'UTC'
  },
  recurring: {
    type: String,
    enum: ['none', 'daily', 'weekly', 'monthly'],
    default: 'none'
  },
  
  // Event details
  type: {
    type: String,
    enum: ['voice_chat', 'workshop', 'panel', 'listening_party', 'game_night', 'other'],
    default: 'voice_chat'
  },
  coverImage: String,
  
  // Capacity
  maxAttendees: {
    type: Number,
    default: 0 // 0 means unlimited
  },
  attendees: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    status: {
      type: String,
      enum: ['going', 'interested', 'not_going'],
      default: 'interested'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    }
  }],
  attendeeCount: {
    type: Number,
    default: 0
  },
  
  // Reminders
  reminders: [{
    type: {
      type: String,
      enum: ['email', 'push'],
      default: 'push'
    },
    time: {
      type: Number, // minutes before event
      default: 60
    },
    sent: {
      type: Boolean,
      default: false
    }
  }],
  
  isActive: {
    type: Boolean,
    default: true
  },
  isFeatured: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Update attendee count
eventSchema.pre('save', function(next) {
  this.attendeeCount = this.attendees.filter(a => a.status === 'going').length;
  next();
});

const Event = mongoose.model('Event', eventSchema);

export default Event;
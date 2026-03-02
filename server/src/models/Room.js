import mongoose from 'mongoose';

const roomSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Room name is required'],
    trim: true,
    minlength: [3, 'Room name must be at least 3 characters'],
    maxlength: [50, 'Room name cannot exceed 50 characters']
  },
  description: {
    type: String,
    maxlength: [200, 'Description cannot exceed 200 characters'],
    default: ''
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: ['language', 'music', 'gaming', 'tech', 'social', 'education', 'other'],
    default: 'social'
  },
  language: {
    type: String,
    default: 'English'
  },
  isPrivate: {
    type: Boolean,
    default: false
  },
  password: {
    type: String,
    select: false,
    required: function() {
      return this.isPrivate;
    }
  },
  host: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  moderators: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  participants: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    },
    isSpeaking: {
      type: Boolean,
      default: false
    },
    isMuted: {
      type: Boolean,
      default: true
    },
    handRaised: {
      type: Boolean,
      default: false
    },
    role: {
      type: String,
      enum: ['host', 'moderator', 'speaker', 'listener'],
      default: 'listener'
    }
  }],
  maxParticipants: {
    type: Number,
    default: 50,
    min: 2,
    max: 1000
  },
  participantCount: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  tags: [{
    type: String,
    trim: true
  }],
  image: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// Index for searching
roomSchema.index({ name: 'text', description: 'text', tags: 'text' });

// Update participant count when participants array is modified
roomSchema.pre('save', function(next) {
  this.participantCount = this.participants.length;
  next();
});

const Room = mongoose.model('Room', roomSchema);

export default Room;
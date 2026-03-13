import mongoose from 'mongoose';

const clubSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Club name is required'],
    unique: true,
    trim: true,
    minlength: [3, 'Club name must be at least 3 characters'],
    maxlength: [50, 'Club name cannot exceed 50 characters']
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot exceed 500 characters'],
    default: ''
  },
  avatar: {
    type: String,
    default: ''
  },
  coverImage: {
    type: String,
    default: ''
  },
  category: {
    type: String,
    enum: ['language', 'music', 'gaming', 'tech', 'social', 'education', 'professional', 'other'],
    required: true
  },
  tags: [{
    type: String,
    trim: true
  }],
  
  // Membership
  isPrivate: {
    type: Boolean,
    default: false
  },
  requiresApproval: {
    type: Boolean,
    default: false
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  admins: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  moderators: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  members: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    role: {
      type: String,
      enum: ['admin', 'moderator', 'member'],
      default: 'member'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['active', 'pending', 'banned'],
      default: 'active'
    }
  }],
  memberCount: {
    type: Number,
    default: 0
  },
  
  // Club rooms
  rooms: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room'
  }],
  
  // Rules
  rules: [{
    title: String,
    description: String
  }],
  
  // Social links
  socialLinks: {
    website: String,
    discord: String,
    twitter: String,
    instagram: String
  },
  
  // Statistics
  totalEvents: {
    type: Number,
    default: 0
  },
  totalRooms: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Update member count
clubSchema.pre('save', function(next) {
  this.memberCount = this.members.filter(m => m.status === 'active').length;
  next();
});

const Club = mongoose.model('Club', clubSchema);

export default Club;
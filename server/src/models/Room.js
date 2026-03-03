import mongoose from "mongoose";

const roomSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Room name is required"],
      trim: true,
      minlength: [3, "Room name must be at least 3 characters"],
      maxlength: [50, "Room name cannot exceed 50 characters"],
    },
    description: {
      type: String,
      maxlength: [200, "Description cannot exceed 200 characters"],
      default: "",
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      enum: [
        "language",
        "music",
        "gaming",
        "tech",
        "social",
        "education",
        "other",
      ],
      default: "social",
    },
    language: {
      type: String,
      default: "English",
    },
    isPrivate: {
      type: Boolean,
      default: false,
    },
    password: {
      type: String,
      select: false,
      required: function () {
        return this.isPrivate;
      },
    },
    host: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    moderators: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    participants: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        joinedAt: {
          type: Date,
          default: Date.now,
        },
        isSpeaking: {
          type: Boolean,
          default: false,
        },
        isMuted: {
          type: Boolean,
          default: true,
        },
        handRaised: {
          type: Boolean,
          default: false,
        },
        role: {
          type: String,
          enum: ["host", "moderator", "speaker", "listener"],
          default: "listener",
        },
      },
    ],
    maxParticipants: {
      type: Number,
      default: 50,
      min: 2,
      max: 1000,
    },
    participantCount: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    image: {
      type: String,
      default: "",
    },
    roomType: {
      type: String,
      enum: ["public", "private", "social", "ticketed", "scheduled"],
      default: "public",
    },

    // Language learning features
    targetLanguages: [
      {
        type: String,
        enum: [
          "English",
          "Spanish",
          "French",
          "German",
          "Chinese",
          "Japanese",
          "Korean",
          "Arabic",
          "Russian",
          "Portuguese",
          "Italian",
          "Dutch",
          "Polish",
          "Turkish",
          "Vietnamese",
          "Thai",
          "Indonesian",
          "Hindi",
          "Bengali",
          "Urdu",
          "Other",
        ],
      },
    ],
    isLanguageExchange: {
      type: Boolean,
      default: false,
    },
    languageLevels: [
      {
        type: String,
        enum: ["beginner", "intermediate", "advanced", "fluent", "native"],
      },
    ],

    // Monetization
    ticketPrice: {
      type: Number,
      min: 0,
      default: 0,
    },
    currency: {
      type: String,
      default: "USD",
    },
    paymentMethods: [
      {
        type: String,
        enum: ["stripe", "paypal", "crypto"],
      },
    ],

    // Scheduling
    scheduledFor: {
      type: Date,
    },
    scheduledEnd: {
      type: Date,
    },
    recurring: {
      type: String,
      enum: ["none", "daily", "weekly", "monthly"],
    },

    // Recording
    allowRecording: {
      type: Boolean,
      default: false,
    },
    recordingUrl: {
      type: String,
    },
    recordingConsent: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        consentedAt: Date,
      },
    ],

    // Enhanced participants
    speakers: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        speakingTime: { type: Number, default: 0 },
        lastSpokeAt: Date,
      },
    ],

    // Gamification
    xpMultiplier: {
      type: Number,
      default: 1.0,
    },

    // Discovery
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    topics: [
      {
        type: String,
        trim: true,
      },
    ],
    aiTags: [
      {
        type: String,
        trim: true,
      },
    ],
    popularityScore: {
      type: Number,
      default: 0,
      index: true,
    },

    // Interactive features
    polls: [
      {
        question: String,
        options: [
          {
            text: String,
            votes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
          },
        ],
        createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        createdAt: Date,
        endsAt: Date,
        isActive: { type: Boolean, default: true },
      },
    ],

    // Queue for speakers
    speakerQueue: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        requestedAt: Date,
        topic: String,
      },
    ],
    // Statistics
    totalSpeakingTime: { type: Number, default: 0 },
    peakParticipants: { type: Number, default: 0 },
    averageListenTime: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  },
);

// Calculate popularity score
roomSchema.pre("save", function (next) {
  const now = new Date();
  const ageInHours = (now - this.createdAt) / (1000 * 60 * 60);

  this.popularityScore =
    this.participantCount * 10 +
    this.peakParticipants * 5 +
    this.totalSpeakingTime / 60 -
    ageInHours * 0.5;

  next();
});

// Index for searching
roomSchema.index({ name: "text", description: "text", tags: "text" });

// Update participant count when participants array is modified
roomSchema.pre("save", function (next) {
  this.participantCount = this.participants.length;
  next();
});

const Room = mongoose.model("Room", roomSchema);

export default Room;

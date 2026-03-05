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
    // Remove duplicate tags array (there's another one below)
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

    // Monetization
    isMonetized: {
      type: Boolean,
      default: false,
    },
    ticketPrice: {
      type: Number,
      min: 0,
      default: 0,
    },
    currency: {
      type: String,
      default: "usd",
      enum: ["usd", "eur", "gbp", "inr"],
    },
    ticketSold: {
      type: Number,
      default: 0,
    },
    revenue: {
      type: Number,
      default: 0,
    },
    platformFee: {
      type: Number,
      default: 0,
    },
    creatorEarnings: {
      type: Number,
      default: 0,
    },

    // Subscription rooms
    isSubscription: {
      type: Boolean,
      default: false,
    },
    subscriptionPrice: {
      type: Number,
      min: 0,
      default: 0,
    },
    subscriptionInterval: {
      type: String,
      enum: ["month", "year"],
      default: "month",
    },
    subscribers: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        subscribedAt: Date,
        expiresAt: Date,
        autoRenew: { type: Boolean, default: true },
        stripeSubscriptionId: String,
      },
    ],

    // Donations
    allowDonations: {
      type: Boolean,
      default: false,
    },
    totalDonations: {
      type: Number,
      default: 0,
    },

    // Payment methods accepted
    acceptedPaymentMethods: [
      {
        type: String,
        enum: ["card", "paypal", "crypto"],
        default: ["card"],
      },
    ],
  },
  {
    timestamps: true,
  },
);

roomSchema.pre("save", async function () {
  // 1. Update participant count
  this.participantCount = this.participants ? this.participants.length : 0;

  // 2. Calculate popularity score
  const now = new Date();

  // Fallback to 'now' if createdAt doesn't exist yet (first save)
  const createdAt = this.createdAt || now;
  const ageInHours = (now - createdAt) / (1000 * 60 * 60);

  this.popularityScore =
    this.participantCount * 10 +
    (this.peakParticipants || 0) * 5 +
    (this.totalSpeakingTime || 0) / 60 -
    ageInHours * 0.5;
});

// Index for searching
roomSchema.index({ name: "text", description: "text", tags: "text" });

const Room = mongoose.model("Room", roomSchema);

export default Room;

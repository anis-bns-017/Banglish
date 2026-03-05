import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, "Username is required"],
      unique: true,
      trim: true,
      minlength: [3, "Username must be at least 3 characters"],
      maxlength: [20, "Username cannot exceed 20 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, "Please enter a valid email"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
      select: false,
    },
    fullName: {
      type: String,
      required: [true, "Full name is required"],
      trim: true,
    },
    avatar: {
      type: String,
      default: "",
    },
    bio: {
      type: String,
      maxlength: [200, "Bio cannot exceed 200 characters"],
      default: "",
    },
    role: {
      type: String,
      enum: ["user", "admin", "moderator"],
      default: "user",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastActive: {
      type: Date,
      default: Date.now,
    },
    refreshToken: {
      type: String,
      select: false,
    },
    passwordResetToken: String,
    passwordResetExpires: Date,
    emailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationToken: String,

    // Gamification
    xp: {
      type: Number,
      default: 0,
    },
    level: {
      type: Number,
      default: 1,
    },
    badges: [
      {
        name: String,
        icon: String,
        earnedAt: Date,
        description: String,
      },
    ],

    // Language learning
    nativeLanguage: {
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
    learningLanguages: [
      {
        language: String,
        level: {
          type: String,
          enum: ["beginner", "intermediate", "advanced", "fluent"],
        },
      },
    ],

    // Following/Followers (Clubhouse style)
    following: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    followers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    // Interests for recommendations
    interests: [String],

    // Statistics
    totalRoomsHosted: { type: Number, default: 0 },
    totalRoomsJoined: { type: Number, default: 0 },
    totalSpeakingTime: { type: Number, default: 0 },
    totalListenTime: { type: Number, default: 0 },

    // Creator settings (for monetization)
    isCreator: { type: Boolean, default: false },
    creatorBio: String,
    stripeAccountId: String,
    paypalEmail: String,

    // Preferences
    notificationPreferences: {
      newFollowers: { type: Boolean, default: true },
      roomReminders: { type: Boolean, default: true },
      friendActivity: { type: Boolean, default: true },
      recommendations: { type: Boolean, default: true },
    },

    // Creator settings
    isCreator: {
      type: Boolean,
      default: false,
    },
    creatorApplication: {
      status: {
        type: String,
        enum: ["pending", "approved", "rejected"],
        default: "pending",
      },
      submittedAt: Date,
      reviewedAt: Date,
      reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      notes: String,
    },

    // Payout information
    stripeAccountId: String,
    stripeAccountStatus: {
      type: String,
      enum: ["pending", "active", "incomplete", "rejected"],
      default: "pending",
    },
    paypalEmail: String,

    // Earnings
    totalEarnings: {
      type: Number,
      default: 0,
    },
    availableBalance: {
      type: Number,
      default: 0,
    },
    pendingBalance: {
      type: Number,
      default: 0,
    },
    lifetimeEarnings: {
      type: Number,
      default: 0,
    },

    // Payout history
    payouts: [
      {
        amount: Number,
        method: String,
        status: {
          type: String,
          enum: ["pending", "processed", "failed"],
          default: "pending",
        },
        requestedAt: Date,
        processedAt: Date,
        transactionId: String,
      },
    ],

    // Purchased tickets/subscriptions
    tickets: [
      {
        room: { type: mongoose.Schema.Types.ObjectId, ref: "Room" },
        purchasedAt: Date,
        amount: Number,
        stripePaymentIntentId: String,
      },
    ],

    subscriptions: [
      {
        room: { type: mongoose.Schema.Types.ObjectId, ref: "Room" },
        startedAt: Date,
        expiresAt: Date,
        autoRenew: { type: Boolean, default: true },
        stripeSubscriptionId: String,
        status: {
          type: String,
          enum: ["active", "canceled", "expired"],
          default: "active",
        },
      },
    ],
  },
  {
    timestamps: true,
  },
);

/* ===============================
   PASSWORD HASH MIDDLEWARE
   (Mongoose 7+ Compatible)
================================ */

userSchema.pre("save", async function () {
  // Only hash if password is modified
  if (!this.isModified("password")) return;

  try {
    this.password = await bcrypt.hash(this.password, 10);
  } catch (error) {
    throw error;
  }
});

// Calculate level based on XP
userSchema.methods.calculateLevel = function () {
  this.level = Math.floor(Math.sqrt(this.xp / 100)) + 1;
  return this.level;
};

// Add XP
userSchema.methods.addXP = async function (amount) {
  this.xp += amount;
  const oldLevel = this.level;
  this.calculateLevel();

  if (oldLevel < this.level) {
    // Level up! Add badge
    this.badges.push({
      name: `Level ${this.level}`,
      icon: "🎉",
      earnedAt: new Date(),
      description: `Reached level ${this.level}`,
    });
  }

  await this.save();
  return this.level;
};

/* ===============================
   COMPARE PASSWORD METHOD
================================ */

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model("User", userSchema);

export default User;

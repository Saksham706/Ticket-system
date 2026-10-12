const mongoose = require("mongoose");

const otpChallengeSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    destination: {
      type: String,
      required: true,
      trim: true,
    },

    purpose: {
      type: String,
      enum: [
        "EMAIL_VERIFICATION",
        "PHONE_VERIFICATION",
        "LOGIN",
        "PASSWORD_RESET",
      ],
      required: true,
      index: true,
    },

    otpHash: {
      type: String,
      required: true,
      select: false,
    },

    attempts: {
      type: Number,
      default: 0,
    },

    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 },
    },

    consumedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);

otpChallengeSchema.index({
  user: 1,
  purpose: 1,
  createdAt: -1,
});

const refreshSessionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    tokenHash: {
      type: String,
      required: true,
      select: false,
    },

    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 },
    },

    revokedAt: {
      type: Date,
      default: null,
    },

    userAgent: {
      type: String,
      default: "",
    },

    ipAddress: {
      type: String,
      default: "",
    },
  },
  { timestamps: true },
);

refreshSessionSchema.index({ user: 1, revokedAt: 1 });

const OtpChallenge = mongoose.model("OtpChallenge", otpChallengeSchema);

const RefreshSession = mongoose.model("RefreshSession", refreshSessionSchema);

module.exports = {
  OtpChallenge,
  RefreshSession,
};

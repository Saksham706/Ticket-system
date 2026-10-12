const mongoose = require("mongoose");

const emailEventSchema = new mongoose.Schema(
  {
    direction: {
      type: String,
      enum: ["outbound", "inbound"],
      required: true,
      index: true,
    },

    messageId: {
      type: String,
      default: null,
    },

    ticket: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Ticket",
      default: null,
      index: true,
    },

    from: {
      type: String,
      required: true,
      trim: true,
    },

    to: {
      type: [String],
      default: [],
    },

    subject: {
      type: String,
      default: "",
    },

    status: {
      type: String,
      enum: ["pending", "processing", "sent", "failed", "received"],
      default: "pending",
      index: true,
    },

    error: {
      type: String,
      default: null,
    },

    processedAt: {
      type: Date,
      default: null,
    },

    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  },
);

emailEventSchema.index({
  ticket: 1,
  createdAt: -1,
});

emailEventSchema.index(
  {
    direction: 1,
    messageId: 1,
  },
  {
    unique: true,
    partialFilterExpression: {
      messageId: { $type: "string" },
    },
  },
);

const EmailEvent = mongoose.model("EmailEvent", emailEventSchema);

module.exports = { EmailEvent };

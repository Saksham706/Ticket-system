const mongoose = require("mongoose");

const ticketSchema = new mongoose.Schema(
  {
    ticketNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 200,
    },

    description: {
      type: String,
      required: true,
      trim: true,
      minlength: 5,
      maxlength: 10000,
    },

    requester: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },

    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
      index: true,
    },

    status: {
      type: String,
      enum: ["open", "in_progress", "pending", "resolved", "closed"],
      default: "open",
      index: true,
    },

    assignedAgent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },

    assignedAt: {
      type: Date,
      default: null,
    },

    resolvedAt: {
      type: Date,
      default: null,
    },

    closedAt: {
      type: Date,
      default: null,
    },

    reopenedAt: {
      type: Date,
      default: null,
    },

    lastMessageAt: {
      type: Date,
      default: Date.now,
      index: true,
    },

    tags: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true },
);

ticketSchema.index({
  requester: 1,
  status: 1,
  createdAt: -1,
});

ticketSchema.index({
  assignedAgent: 1,
  status: 1,
  lastMessageAt: -1,
});

const Ticket = mongoose.model("Ticket", ticketSchema);

module.exports = { Ticket };

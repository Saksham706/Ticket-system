const mongoose = require("mongoose");

const attachmentSchema = new mongoose.Schema(
  {
    originalName: {
      type: String,
      required: true,
    },

    storedName: {
      type: String,
      required: true,
    },

    mimeType: {
      type: String,
      required: true,
    },

    size: {
      type: Number,
      required: true,
    },

    path: {
      type: String,
      required: true,
    },
  },
  { _id: false }
);

const ticketMessageSchema = new mongoose.Schema(
  {
    ticket: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Ticket",
      required: true,
      index: true,
    },

    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    senderRole: {
      type: String,
      enum: ["customer", "agent", "admin"],
      required: true,
    },

    body: {
      type: String,
      required: true,
      trim: true,
      maxlength: 20000,
    },

    type: {
      type: String,
      enum: ["public", "internal"],
      default: "public",
      index: true,
    },

    source: {
      type: String,
      enum: ["web", "email", "system"],
      default: "web",
    },

    attachments: {
      type: [attachmentSchema],
      default: [],
    },

    emailMessageId: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

ticketMessageSchema.index({
  ticket: 1,
  createdAt: 1,
});

ticketMessageSchema.index(
  { emailMessageId: 1 },
  {
    unique: true,
    partialFilterExpression: {
      emailMessageId: { $type: "string" },
    },
  }
);

const TicketMessage = mongoose.model(
  "TicketMessage",
  ticketMessageSchema
);

module.exports = { TicketMessage };
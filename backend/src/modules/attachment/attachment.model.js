const mongoose = require("mongoose");

const attachmentSchema = new mongoose.Schema(
  {
    ticket: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Ticket",
      required: true,
      index: true,
    },

    message: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TicketMessage",
      default: null,
    },

    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    originalName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 255,
    },

    storedName: {
      type: String,
      required: true,
      unique: true,
    },

    mimeType: {
      type: String,
      required: true,
    },

    size: {
      type: Number,
      required: true,
      min: 1,
    },

    storagePath: {
      type: String,
      required: true,
      select: false,
    },
  },
  {
    timestamps: true,
  },
);

attachmentSchema.index({
  ticket: 1,
  createdAt: -1,
});

const Attachment = mongoose.model("Attachment", attachmentSchema);

module.exports = { Attachment };

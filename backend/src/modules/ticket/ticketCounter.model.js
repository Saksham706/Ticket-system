const mongoose = require("mongoose");

const ticketCounterSchema = new mongoose.Schema(
  {
    year: { type: Number, required: true, unique: true, index: true },
    sequence: { type: Number, required: true, default: 0, min: 0 },
  },
  { timestamps: true, versionKey: false },
);

module.exports = {
  TicketCounter: mongoose.model("TicketCounter", ticketCounterSchema),
};

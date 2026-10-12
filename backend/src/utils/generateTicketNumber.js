const { TicketCounter } = require("../modules/ticket/ticketCounter.model");

/**
 * Generates a concurrency-safe human-readable ticket number.
 * MongoDB's atomic increment prevents concurrent requests from receiving the
 * same sequence. A duplicate-key retry handles simultaneous first inserts
 * for a new year.
 */
async function generateTicketNumber(now = new Date()) {
  const year = now.getFullYear();
  let counter;

  try {
    counter = await TicketCounter.findOneAndUpdate(
      { year },
      { $inc: { sequence: 1 }, $setOnInsert: { year } },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    );
  } catch (error) {
    if (error.code !== 11000) throw error;
    counter = await TicketCounter.findOneAndUpdate(
      { year },
      { $inc: { sequence: 1 } },
      { new: true },
    );
  }

  if (!counter || !Number.isInteger(counter.sequence) || counter.sequence < 1) {
    throw new Error("Unable to generate a ticket number");
  }

  return `TKT-${year}-${String(counter.sequence).padStart(6, "0")}`;
}

module.exports = { generateTicketNumber };

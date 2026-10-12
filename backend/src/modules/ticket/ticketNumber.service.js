const { Ticket } = require("./ticket.model");

async function generateTicketNumber() {
  const year = new Date().getFullYear();
  const prefix = `TKT-${year}-`;

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const latest = await Ticket.findOne({
      ticketNumber: { $regex: `^${prefix}` },
    })
      .sort({ ticketNumber: -1 })
      .select("ticketNumber")
      .lean();

    const previousSequence = latest
      ? Number(latest.ticketNumber.split("-").pop()) || 0
      : 0;

    const ticketNumber = `${prefix}${String(previousSequence + 1).padStart(6, "0")}`;

    const exists = await Ticket.exists({ ticketNumber });

    if (!exists) {
      return ticketNumber;
    }
  }

  throw new Error("Unable to generate a unique ticket number; please retry");
}

module.exports = { generateTicketNumber };

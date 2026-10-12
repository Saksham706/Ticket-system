const { TicketActivity } = require("./ticketActivity.model");

const createActivity = (data) =>
  TicketActivity.create(data);

async function listByTicket(ticketId, { page = 1, limit = 20 } = {}) {
  const skip = (page - 1) * limit;

  const [activities, total] = await Promise.all([
    TicketActivity.find({ ticket: ticketId })
      .populate("actor", "fullName email role")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),

    TicketActivity.countDocuments({ ticket: ticketId }),
  ]);

  return {
    activities,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
}

module.exports = {
  createActivity,
  listByTicket,
};
const { EmailEvent } = require("./emailEvent.model");

async function createEmailEvent(data) {
  return EmailEvent.create(data);
}

async function findEmailEventById(id) {
  return EmailEvent.findById(id);
}

async function updateEmailEvent(id, update) {
  return EmailEvent.findByIdAndUpdate(id, { $set: update }, { new: true });
}

async function listEmailEvents({
  page = 1,
  limit = 20,
  ticketId,
  status,
  direction,
} = {}) {
  const filter = {};

  if (ticketId) {
    filter.ticket = ticketId;
  }

  if (status) {
    filter.status = status;
  }

  if (direction) {
    filter.direction = direction;
  }

  const [events, total] = await Promise.all([
    EmailEvent.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("ticket", "ticketNumber title"),

    EmailEvent.countDocuments(filter),
  ]);

  return {
    events,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
}

module.exports = {
  createEmailEvent,
  findEmailEventById,
  updateEmailEvent,
  listEmailEvents,
};

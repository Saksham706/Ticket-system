const { TicketMessage } = require("./ticketMessage.model");

const createMessage = (data) =>
  TicketMessage.create(data);

async function listMessages(ticketId, {
  page = 1,
  limit = 20,
  includeInternal = false,
} = {}) {
  const filter = { ticket: ticketId };

  if (!includeInternal) {
    filter.type = "public";
  }

  const skip = (page - 1) * limit;

  const [messages, total] = await Promise.all([
    TicketMessage.find(filter)
      .populate("sender", "fullName email role")
      .sort({ createdAt: 1 })
      .skip(skip)
      .limit(limit),

    TicketMessage.countDocuments(filter),
  ]);

  return {
    messages,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
}

module.exports = {
  createMessage,
  listMessages,
};
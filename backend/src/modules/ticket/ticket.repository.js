const { Ticket } = require("./ticket.model");

const createTicket = (data) => Ticket.create(data);

const findById = (id) =>
  Ticket.findById(id)
    .populate("requester", "fullName email role")
    .populate("assignedAgent", "fullName email role")
    .populate("category", "name description");

async function listTickets({
  user,
  page = 1,
  limit = 20,
  status,
  priority,
  category,
  assignedAgent,
  search,
}) {
  const filter = {};

  if (user.role === "customer") {
    filter.requester = user.id;
  } else if (user.role === "agent") {
    filter.$or = [
      { assignedAgent: user.id },
      { requester: user.id },
    ];
  }

  if (status) filter.status = status;
  if (priority) filter.priority = priority;
  if (category) filter.category = category;

  if (assignedAgent && user.role !== "customer") {
    filter.assignedAgent = assignedAgent;
  }

  if (search) {
    filter.title = {
      $regex: search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
      $options: "i",
    };
  }

  const skip = (page - 1) * limit;

  const [tickets, total] = await Promise.all([
    Ticket.find(filter)
      .populate("requester", "fullName email")
      .populate("assignedAgent", "fullName email")
      .populate("category", "name")
      .sort({ lastMessageAt: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit),

    Ticket.countDocuments(filter),
  ]);

  return {
    tickets,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
}

const updateTicket = (id, updates) =>
  Ticket.findByIdAndUpdate(
    id,
    { $set: updates },
    { new: true, runValidators: true }
  )
    .populate("requester", "fullName email")
    .populate("assignedAgent", "fullName email")
    .populate("category", "name");

module.exports = {
  createTicket,
  findById,
  listTickets,
  updateTicket,
};
const { User } = require("../user/user.model");
const { Category } = require("../category/category.model");
const { Ticket } = require("./ticket.model");
const ticketInAppNotificationService = require("../notification/ticketInAppNotification.service");
const ApiError = require("../../utils/ApiError");
const ticketRepository = require("./ticket.repository");
const { generateTicketNumber } = require("./ticketNumber.service");
const ticketPolicy = require("./ticketPolicy");
const activityService = require("../ticketActivity/ticketActivity.service");
const ticketNotificationService = require("../email/ticketNotification.service");
const { recordAudit } = require("../../services/audit.service");

async function createTicket(data, user) {
  const category = await Category.findById(data.category);

  if (!category || !category.isActive) {
    throw new ApiError(400, "Selected category is invalid or inactive");
  }

  // Automatically select the agent with the lowest workload.
  const agent = await findAvailableAgent();

  const ticketNumber = await generateTicketNumber();

  const ticket = await ticketRepository.createTicket({
    ticketNumber,
    title: data.title,
    description: data.description,
    requester: user.id,
    category: category._id,
    priority: data.priority || "medium",
    status: agent ? "in_progress" : "open",
    assignedAgent: agent ? agent._id : null,
    assignedAt: agent ? new Date() : null,
    lastMessageAt: new Date(),
  });

  // Record ticket creation.
  await activityService.recordActivity({
    ticketId: ticket._id,
    actorId: user.id,
    action: "ticket_created",
    description: `Ticket ${ticket.ticketNumber} was created`,
    changes: {
      status: {
        from: null,
        to: agent ? "in_progress" : "open",
      },
    },
  });

  await recordAudit({
    actor: user.id,
    action: "ticket_created",
    resourceType: "ticket",
    resourceId: ticket._id,
    metadata: {
      ticketNumber: ticket.ticketNumber,
      title: ticket.title,
      status: ticket.status,
    },
    ipAddress: "",
  });
  // Record automatic assignment separately.
  if (agent) {
    await activityService.recordActivity({
      ticketId: ticket._id,
      actorId: user.id,
      action: "ticket_assigned",
      description: `Ticket automatically assigned to ${agent.fullName}`,
      changes: {
        assignedAgent: {
          from: null,
          to: agent._id.toString(),
        },
      },
    });
  }

  const populatedTicket = await ticketRepository.findById(ticket._id);
  await ticketInAppNotificationService.notifyTicketCreated(populatedTicket);

  // Notify the customer that their ticket was created.
  try {
    await ticketNotificationService.ticketCreated(populatedTicket);
  } catch (error) {
    console.error(
      "Ticket created, but creation notification failed:",
      error.message,
    );
  }

  // Notify the assigned agent.
  if (agent) {
    try {
      await ticketNotificationService.ticketAssigned(populatedTicket);
    } catch (error) {
      console.error(
        "Ticket created, but assignment notification failed:",
        error.message,
      );
    }
  }

  return populatedTicket;
}

async function listTickets(query, user) {
  return ticketRepository.listTickets({
    user,
    page: Math.max(1, Number(query.page) || 1),
    limit: Math.min(100, Math.max(1, Number(query.limit) || 20)),
    status: query.status,
    priority: query.priority,
    category: query.category,
    assignedAgent: query.assignedAgent,
    search: query.search,
  });
}

async function getTicket(ticketId, user) {
  const ticket = await ticketPolicy.getAccessibleTicket(ticketId, user);

  return ticketRepository.findById(ticket._id);
}

async function updateTicket(ticketId, data, user) {
  const ticket = await ticketPolicy.getAccessibleTicket(ticketId, user);

  if (user.role === "customer") {
    throw new ApiError(
      403,
      "Customers cannot directly update ticket properties",
    );
  }

  const previous = {
    title: ticket.title,
    priority: ticket.priority,
    status: ticket.status,
    category: ticket.category.toString(),
  };

  if (data.category) {
    const category = await Category.findById(data.category);

    if (!category || !category.isActive) {
      throw new ApiError(400, "Selected category is invalid or inactive");
    }
  }

  if (data.status && data.status !== ticket.status) {
    throw new ApiError(
      400,
      "Use the dedicated ticket lifecycle endpoints to change status",
    );
  }

  const updated = await ticketRepository.updateTicket(ticket._id, data);

  await activityService.recordActivity({
    ticketId: ticket._id,
    actorId: user.id,
    action: "ticket_updated",
    description: "Ticket details were updated",
    changes: {
      before: previous,
      after: {
        title: updated.title,
        priority: updated.priority,
        status: updated.status,
        category: updated.category._id.toString(),
      },
    },
  });

  return updated;
}

async function assignTicket(ticketId, agentId, user) {
  if (!["admin", "agent"].includes(user.role)) {
    throw new ApiError(403, "Only support staff can assign tickets");
  }

  const ticket = await ticketPolicy.getAccessibleTicket(ticketId, user);

  const agent = await User.findOne({
    _id: agentId,
    role: "agent",
    isActive: true,
  });

  if (!agent) {
    throw new ApiError(400, "Selected support agent is invalid");
  }

  const previousAgent = ticket.assignedAgent
    ? ticket.assignedAgent.toString()
    : null;

  ticket.assignedAgent = agent._id;
  ticket.assignedAt = new Date();

  if (ticket.status === "open") {
    ticket.status = "in_progress";
  }

  await ticket.save();

  await activityService.recordActivity({
    ticketId: ticket._id,
    actorId: user.id,
    action: "ticket_assigned",
    description: `Ticket assigned to ${agent.fullName}`,
    changes: {
      assignedAgent: {
        from: previousAgent,
        to: agent._id.toString(),
      },
    },
  });
  await recordAudit({
    actor: user.id,
    action: "ticket_updated",
    resourceType: "ticket",
    resourceId: ticket._id,
    metadata: {
      updatedFields: Object.keys(data),
    },
    ipAddress: "",
  });

  const populatedTicket = await ticketRepository.findById(ticket._id);

  await ticketNotificationService.ticketAssigned(populatedTicket);
  await ticketInAppNotificationService.notifyTicketAssigned(populatedTicket);

  return populatedTicket;
}

async function changeStatus(ticketId, newStatus, user) {
  const ticket = await ticketPolicy.getAccessibleTicket(ticketId, user);

  if (user.role === "customer") {
    throw new ApiError(403, "Customers cannot change ticket status directly");
  }

  const allowedTransitions = {
    open: ["in_progress", "pending", "resolved", "closed"],
    in_progress: ["pending", "resolved", "closed"],
    pending: ["in_progress", "resolved", "closed"],
    resolved: ["open", "in_progress", "closed"],
    closed: ["open", "in_progress"],
  };

  if (ticket.status === newStatus) {
    return ticketRepository.findById(ticket._id);
  }

  if (!allowedTransitions[ticket.status]?.includes(newStatus)) {
    throw new ApiError(
      400,
      `Cannot change ticket status from ${ticket.status} to ${newStatus}`,
    );
  }

  const previousStatus = ticket.status;
  ticket.status = newStatus;

  if (newStatus === "resolved") {
    ticket.resolvedAt = new Date();
    ticket.closedAt = null;
  } else if (newStatus === "closed") {
    ticket.closedAt = new Date();
  } else if (newStatus === "open" || newStatus === "in_progress") {
    ticket.reopenedAt = new Date();
    ticket.resolvedAt = null;
    ticket.closedAt = null;
  }

  await ticket.save();

  await activityService.recordActivity({
    ticketId: ticket._id,
    actorId: user.id,
    action: `ticket_${newStatus}`,
    description: `Ticket status changed from ${previousStatus} to ${newStatus}`,
    changes: {
      status: {
        from: previousStatus,
        to: newStatus,
      },
    },
  });
  await recordAudit({
    actor: user.id,
    action: "ticket_status_changed",
    resourceType: "ticket",
    resourceId: ticket._id,
    metadata: {
      previousStatus: previousStatus,
      newStatus: newStatus,
    },
    ipAddress: "",
  });

  const populatedTicket = await ticketRepository.findById(ticket._id);

  await ticketNotificationService.ticketStatusChanged(
    populatedTicket,
    newStatus,
  );

  await ticketInAppNotificationService.notifyTicketStatusChanged(
    populatedTicket,
    newStatus,
  );
  return populatedTicket;
}

async function resolveTicket(ticketId, user) {
  return changeStatus(ticketId, "resolved", user);
}

async function reopenTicket(ticketId, user) {
  return changeStatus(ticketId, "open", user);
}

async function closeTicket(ticketId, user) {
  return changeStatus(ticketId, "closed", user);
}

async function findAvailableAgent() {
  // Find active users whose role is agent.
  const agents = await User.find({
    role: "agent",
    isActive: true,
  }).select("_id fullName email");

  if (agents.length === 0) {
    return null;
  }

  const workload = await Ticket.aggregate([
    {
      $match: {
        assignedAgent: { $in: agents.map((agent) => agent._id) },
        status: {
          $in: ["open", "in_progress", "pending"],
        },
      },
    },
    {
      $group: {
        _id: "$assignedAgent",
        activeTickets: { $sum: 1 },
      },
    },
  ]);

  const workloadMap = new Map(
    workload.map((item) => [item._id.toString(), item.activeTickets]),
  );
  agents.sort((a, b) => {
    const workloadA = workloadMap.get(a._id.toString()) || 0;
    const workloadB = workloadMap.get(b._id.toString()) || 0;

    if (workloadA !== workloadB) {
      return workloadA - workloadB;
    }

    return a._id.toString().localeCompare(b._id.toString());
  });

  return agents[0];
}
module.exports = {
  createTicket,
  listTickets,
  getTicket,
  updateTicket,
  assignTicket,
  resolveTicket,
  reopenTicket,
  closeTicket,
  findAvailableAgent,
};

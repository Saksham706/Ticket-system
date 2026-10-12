const ApiError = require("../../utils/ApiError");

const ticketPolicy = require("../ticket/ticketPolicy");
const repository = require("./ticketMessage.repository");
const activityService = require("../ticketActivity/ticketActivity.service");
const ticketRepository = require("../ticket/ticket.repository");
const ticketNotificationService = require("../email/ticketNotification.service");
const ticketInAppNotificationService = require("../notification/ticketInAppNotification.service");
function getUserId(user) {
  return ticketPolicy.normalizeId(user?._id || user?.id);
}

function isAssignedAgent(ticket, user) {
  const assignedAgentId = ticketPolicy.normalizeId(ticket.assignedAgent);
  const currentUserId = getUserId(user);

  return Boolean(
    assignedAgentId && currentUserId && assignedAgentId === currentUserId,
  );
}

async function createMessage(ticketId, data, user) {
  const ticket = await ticketPolicy.getAccessibleTicket(ticketId, user);

  const type = data.type || "public";

  if (!["public", "internal"].includes(type)) {
    throw new ApiError(400, "Invalid message type");
  }

  const role = String(user.role || "").toLowerCase();

  if (type === "internal" && !["admin", "agent"].includes(role)) {
    throw new ApiError(403, "Only support staff can create internal notes");
  }

  if (role === "agent" && !isAssignedAgent(ticket, user)) {
    throw new ApiError(
      403,
      "Agents can reply only to tickets assigned to them",
    );
  }

  if (typeof data.body !== "string" || !data.body.trim()) {
    throw new ApiError(400, "Message body is required");
  }

  const message = await repository.createMessage({
    ticket: ticket._id,
    sender: getUserId(user),
    senderRole: role,
    body: data.body.trim(),
    type,
    source: "web",
    attachments: [],
  });

  const previousStatus = ticket.status;

  if (
    role === "customer" &&
    type === "public" &&
    ["resolved", "closed"].includes(ticket.status)
  ) {
    ticket.status = "open";
    ticket.reopenedAt = new Date();
    ticket.resolvedAt = null;
    ticket.closedAt = null;
  }

  ticket.lastMessageAt = new Date();

  await ticket.save();

  await activityService.recordActivity({
    ticketId: ticket._id,
    actorId: getUserId(user),
    action: type === "internal" ? "internal_note_added" : "message_added",
    description:
      type === "internal"
        ? "An internal note was added"
        : "A ticket reply was added",
    changes: {
      messageType: type,
      status: {
        from: previousStatus,
        to: ticket.status,
      },
    },
  });

  const populatedMessage = await message.populate(
    "sender",
    "fullName email role",
  );

  if (type === "public") {
    const populatedTicket = await ticketRepository.findById(ticket._id);

    try {
      await ticketNotificationService.ticketReply(populatedTicket, {
        body: populatedMessage.body,
        senderRole: role,
      });
    } catch (error) {
      console.error("Email reply notification failed:", error.message);
    }

    await ticketInAppNotificationService.notifyPublicReply(
      populatedTicket,
      role,
    );
  }

  return populatedMessage;
}

async function getMessages(ticketId, query, user) {
  const ticket = await ticketPolicy.getAccessibleTicket(ticketId, user);

  const role = String(user.role || "").toLowerCase();

  const includeInternal =
    ["admin", "agent"].includes(role) && query.includeInternal === "true";

  if (includeInternal && role === "agent" && !isAssignedAgent(ticket, user)) {
    throw new ApiError(403, "Only the assigned agent can view internal notes");
  }

  return repository.listMessages(ticket._id, {
    page: Math.max(1, Number(query.page) || 1),
    limit: Math.min(100, Math.max(1, Number(query.limit) || 20)),
    includeInternal,
  });
}

module.exports = {
  createMessage,
  getMessages,
};

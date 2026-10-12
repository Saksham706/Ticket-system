const notificationService = require("./notification.service");

async function createInAppNotification({
  userId,
  type,
  title,
  message,
  ticketId,
}) {
  if (!userId || !ticketId) {
    return null;
  }

  try {
    return await notificationService.createNotification({
      user: userId,
      type,
      title,
      message,
      resourceType: "ticket",
      resourceId: ticketId,
    });
  } catch (error) {
    console.error("In-app notification creation failed:", {
      type,
      ticketId: String(ticketId),
      userId: String(userId),
      message: error.message,
    });

    return null;
  }
}

async function notifyTicketCreated(ticket) {
  if (!ticket) return;

  await createInAppNotification({
    userId: ticket.requester?._id || ticket.requester,
    type: "ticket_created",
    title: "Ticket created successfully",
    message: `Your ticket "${ticket.title}" has been created.`,
    ticketId: ticket._id,
  });

  const assignedAgent = ticket.assignedAgent?._id || ticket.assignedAgent;

  if (assignedAgent) {
    await createInAppNotification({
      userId: assignedAgent,
      type: "ticket_assigned",
      title: "New ticket assigned",
      message: `Ticket "${ticket.title}" has been assigned to you.`,
      ticketId: ticket._id,
    });
  }
}

async function notifyTicketAssigned(ticket) {
  if (!ticket) return;

  const assignedAgent = ticket.assignedAgent?._id || ticket.assignedAgent;

  if (!assignedAgent) return;

  await createInAppNotification({
    userId: assignedAgent,
    type: "ticket_assigned",
    title: "Ticket assigned to you",
    message: `You have been assigned ticket "${ticket.title}".`,
    ticketId: ticket._id,
  });
}

async function notifyPublicReply(ticket, senderRole) {
  if (!ticket) return;

  const requester = ticket.requester?._id || ticket.requester;
  const assignedAgent =
    ticket.assignedAgent?._id || ticket.assignedAgent;

  let recipientId;
  let title;
  let message;

  if (senderRole === "agent" || senderRole === "admin") {
    recipientId = requester;
    title = "New reply on your ticket";
    message = `Support has replied to ticket "${ticket.title}".`;
  } else if (senderRole === "customer") {
    recipientId = assignedAgent;
    title = "New customer reply";
    message = `The customer replied to ticket "${ticket.title}".`;
  }

  if (!recipientId) return;

  await createInAppNotification({
    userId: recipientId,
    type: "ticket_reply",
    title,
    message,
    ticketId: ticket._id,
  });
}

async function notifyTicketStatusChanged(ticket, newStatus) {
  if (!ticket) return;

  const requester = ticket.requester?._id || ticket.requester;
  const assignedAgent =
    ticket.assignedAgent?._id || ticket.assignedAgent;

  const statusLabels = {
    open: "Open",
    in_progress: "In progress",
    pending: "Pending",
    resolved: "Resolved",
    closed: "Closed",
  };

  const statusLabel = statusLabels[newStatus] || newStatus;

  await createInAppNotification({
    userId: requester,
    type: "ticket_status_changed",
    title: "Ticket status updated",
    message: `Your ticket "${ticket.title}" is now ${statusLabel}.`,
    ticketId: ticket._id,
  });

  if (assignedAgent) {
    await createInAppNotification({
      userId: assignedAgent,
      type: "ticket_status_changed",
      title: "Ticket status updated",
      message: `Ticket "${ticket.title}" is now ${statusLabel}.`,
      ticketId: ticket._id,
    });
  }
}

module.exports = {
  notifyTicketCreated,
  notifyTicketAssigned,
  notifyPublicReply,
  notifyTicketStatusChanged,
};
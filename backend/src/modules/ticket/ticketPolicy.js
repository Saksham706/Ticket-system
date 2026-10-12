const ApiError = require("../../utils/ApiError");
const ticketRepository = require("./ticket.repository");

function normalizeId(value) {
  if (!value) return null;

  if (typeof value === "object" && value._id) {
    return String(value._id);
  }

  if (typeof value === "object" && value.id) {
    return String(value.id);
  }

  return String(value);
}

function canAccessTicket(ticket, user) {
  if (!ticket || !user) {
    return false;
  }

  const role = String(user.role || "").toLowerCase();
  const userId = normalizeId(user._id || user.id);

  if (!userId) {
    return false;
  }

  if (role === "admin") {
    return true;
  }

  const requesterId = normalizeId(ticket.requester);
  const assignedAgentId = normalizeId(ticket.assignedAgent);

  if (role === "customer") {
    return requesterId === userId;
  }

  if (role === "agent") {
    return (
      assignedAgentId === userId ||
      requesterId === userId
    );
  }

  return false;
}

async function getAccessibleTicket(ticketId, user) {
  if (!ticketId) {
    throw new ApiError(400, "Ticket ID is required");
  }

  if (!user) {
    throw new ApiError(401, "Authentication is required");
  }

  const ticket = await ticketRepository.findById(ticketId);

  if (!ticket) {
    throw new ApiError(404, "Ticket not found");
  }

  if (!canAccessTicket(ticket, user)) {
    throw new ApiError(
      403,
      "You do not have permission to access this ticket"
    );
  }

  return ticket;
}

module.exports = {
  normalizeId,
  canAccessTicket,
  getAccessibleTicket,
};
const { Ticket } = require("../ticket/ticket.model");
const { EmailEvent } = require("./emailEvent.model");
const ApiError = require("../../utils/ApiError");

function extractTicketNumber(subject = "") {
  const match = String(subject).match(/\bTKT-\d{4}-\d{6,}\b/i);
  return match ? match[0].toUpperCase() : null;
}

function messageIdVariants(value) {
  if (!value) return [];
  const id = String(value).trim();
  const unwrapped = id.replace(/^<|>$/g, "");
  return [...new Set([id, `<${unwrapped}>`, unwrapped].filter(Boolean))];
}

/** Resolve a ticket from standard email thread headers first. */
async function findTicketFromHeaders({ inReplyTo, references = [] } = {}) {
  const ids = [
    ...new Set([
      ...messageIdVariants(inReplyTo),
      ...references.flatMap(messageIdVariants),
    ]),
  ];

  if (!ids.length) return null;

  const event = await EmailEvent.findOne({
    direction: "outbound",
    messageId: { $in: ids },
    ticket: { $ne: null },
  }).sort({ createdAt: -1 });

  if (!event?.ticket) return null;
  return Ticket.findById(event.ticket).populate(
    "requester",
    "fullName email role",
  );
}

/**
 * Legacy subject fallback is retained for compatibility with mail clients that
 * strip References. The caller MUST still validate the sender against the
 * ticket requester before accepting the reply.
 */
async function findTicketFromSubject(subject) {
  const ticketNumber = extractTicketNumber(subject);
  if (!ticketNumber) return null;
  return Ticket.findOne({ ticketNumber }).populate(
    "requester",
    "fullName email role",
  );
}

async function findTicketForInboundEmail(email) {
  const byHeaders = await findTicketFromHeaders(email);
  if (byHeaders) return { ticket: byHeaders, matchedBy: "headers" };

  const bySubject = await findTicketFromSubject(email.subject);
  if (bySubject) return { ticket: bySubject, matchedBy: "subject-fallback" };

  return { ticket: null, matchedBy: null };
}

async function requireTicketFromSubject(subject) {
  const ticket = await findTicketFromSubject(subject);
  if (!ticket) throw new ApiError(404, "No ticket matched the email subject");
  return ticket;
}

module.exports = {
  extractTicketNumber,
  findTicketFromHeaders,
  findTicketFromSubject,
  findTicketForInboundEmail,
  requireTicketFromSubject,
};

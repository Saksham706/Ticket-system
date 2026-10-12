const { Ticket } = require("../ticket/ticket.model");
const { TicketMessage } = require("../ticketMessage/ticketMessage.model");
const { EmailEvent } = require("./emailEvent.model");
const { parseInboundEmail } = require("./emailParser");
const { findTicketForInboundEmail } = require("./emailThreading.service");
const activityService = require("../ticketActivity/ticketActivity.service");
const { notifyUser } = require("../../services/socket.service");
const ApiError = require("../../utils/ApiError");
const logger = require("../../utils/logger");

function safeBody(email) {
  // `text` from mailparser is plain text. Do not render the raw `html` field.
  const body = String(email.text || "").trim();
  return body.slice(0, 20000);
}

async function processInboundEmail(rawMessage) {
  const email = parseInboundEmail(rawMessage);

  if (!email.sender || !email.messageId) {
    throw new ApiError(400, "Inbound email is missing sender or Message-ID");
  }

  const existing = await EmailEvent.findOne({
    direction: "inbound",
    messageId: email.messageId,
  });

  if (existing?.status === "received") {
    return { duplicate: true, event: existing };
  }
  if (existing?.status === "processing") {
    return { duplicate: true, event: existing, processing: true };
  }

  const { ticket, matchedBy } = await findTicketForInboundEmail(email);
  if (!ticket) {
    throw new ApiError(404, "Could not match this email to a ticket thread");
  }

  const requester = ticket.requester;
  const sender = email.sender.toLowerCase();
  const requesterEmail = requester?.email?.toLowerCase();

  // Current assignment design allows only the original requester to reply by email.
  if (!requesterEmail || sender !== requesterEmail) {
    throw new ApiError(403, "Email sender is not the ticket requester");
  }

  const body = safeBody(email);
  if (!body)
    throw new ApiError(400, "Inbound email does not contain a reply body");

  let event = existing;
  if (!event) {
    try {
      event = await EmailEvent.create({
        direction: "inbound",
        messageId: email.messageId,
        ticket: ticket._id,
        from: email.sender,
        to: email.recipients,
        subject: email.subject,
        status: "processing",
        metadata: {
          inReplyTo: email.inReplyTo || null,
          references: email.references,
          receivedAt: email.receivedAt,
          matchedBy,
        },
      });
    } catch (error) {
      if (error.code === 11000) {
        const duplicate = await EmailEvent.findOne({
          direction: "inbound",
          messageId: email.messageId,
        });
        if (duplicate) return { duplicate: true, event: duplicate };
      }
      throw error;
    }
  } else {
    event.status = "processing";
    event.error = null;
    await event.save();
  }

  try {
    // A second idempotency check protects against retries after a partial failure.
    let message = await TicketMessage.findOne({
      emailMessageId: email.messageId,
    });
    if (!message) {
      message = await TicketMessage.create({
        ticket: ticket._id,
        sender: requester._id,
        senderRole: "customer",
        body,
        type: "public",
        source: "email",
        emailMessageId: email.messageId,
      });
    }

    const previousStatus = ticket.status;
    if (ticket.status === "resolved" || ticket.status === "closed") {
      ticket.status = "open";
      ticket.reopenedAt = email.receivedAt || new Date();
      ticket.resolvedAt = null;
      ticket.closedAt = null;
    }
    ticket.lastMessageAt = email.receivedAt || new Date();
    await ticket.save();

    await activityService.recordActivity({
      ticketId: ticket._id,
      actorId: requester._id,
      action:
        previousStatus === "resolved" || previousStatus === "closed"
          ? "ticket_reopened_by_email"
          : "email_reply_received",
      description:
        previousStatus === "resolved" || previousStatus === "closed"
          ? `Ticket reopened by a reply from ${sender}`
          : `Email reply received from ${sender}`,
      changes: {
        source: "email",
        messageId: email.messageId,
        status:
          previousStatus === ticket.status
            ? undefined
            : { from: previousStatus, to: ticket.status },
      },
    });

    event.status = "received";
    event.processedAt = new Date();
    event.error = null;
    await event.save();

    try {
      notifyUser(String(requester._id), "ticket:message", {
        ticketId: String(ticket._id),
        ticketNumber: ticket.ticketNumber,
        messageId: String(message._id),
      });
      if (ticket.assignedAgent) {
        notifyUser(String(ticket.assignedAgent), "ticket:message", {
          ticketId: String(ticket._id),
          ticketNumber: ticket.ticketNumber,
          messageId: String(message._id),
        });
      }
    } catch (socketError) {
      logger.warn("Could not emit inbound email socket event", {
        error: socketError.message,
      });
    }

    logger.info("Inbound email processed", {
      messageId: email.messageId,
      ticketId: String(ticket._id),
      matchedBy,
    });

    return { duplicate: false, ticket, message, event };
  } catch (error) {
    event.status = "failed";
    event.error = String(error.message || error).slice(0, 1000);
    await event.save().catch(() => {});
    logger.error("Inbound email processing failed", {
      messageId: email.messageId,
      ticketId: String(ticket._id),
      error: error.message,
    });
    throw error;
  }
}

module.exports = { processInboundEmail };

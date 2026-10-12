const { getMailTransporter } = require("../../config/mail");
const env = require("../../config/env");
const repository = require("./email.repository");
const { EmailEvent } = require("./emailEvent.model");
const logger = require("../../utils/logger");

async function sendEmail({
  to,
  subject,
  text,
  html,
  ticketId,
  messageId,
  inReplyTo,
  references,
  replyTo,
}) {
  if (!to || !subject || (!text && !html)) {
    throw new Error("Recipient, subject, and email content are required");
  }

  const from = env.SMTP_FROM_EMAIL || env.SMTP_USER;
  if (!from) throw new Error("SMTP_FROM_EMAIL or SMTP_USER must be configured");

  // Continue the most recent email thread for this ticket when possible.
  // Nodemailer will generate a fresh Message-ID for this outbound message.
  if (ticketId && !inReplyTo) {
    const previousEvent = await EmailEvent.findOne({
      ticket: ticketId,
      messageId: { $type: "string" },
    }).sort({ createdAt: -1 });
    if (previousEvent?.messageId) {
      inReplyTo = previousEvent.messageId;
      references = [
        ...new Set([...(references || []), previousEvent.messageId]),
      ];
    }
  }

  const event = await repository.createEmailEvent({
    direction: "outbound",
    messageId: messageId || null,
    ticket: ticketId || null,
    from,
    to: Array.isArray(to) ? to : [to],
    subject,
    status: "processing",
    metadata: {
      inReplyTo: inReplyTo || null,
      references: references || [],
    },
  });

  try {
    const transporter = getMailTransporter();
    const result = await transporter.sendMail({
      from,
      to,
      subject,
      text,
      html,
      inReplyTo,
      references,
      replyTo,
    });

    await repository.updateEmailEvent(event._id, {
      status: "sent",
      messageId: result.messageId || messageId || null,
      processedAt: new Date(),
      metadata: {
        inReplyTo: inReplyTo || null,
        references: references || [],
        accepted: result.accepted || [],
        rejected: result.rejected || [],
        response: result.response || null,
      },
    });

    return {
      eventId: event._id,
      messageId: result.messageId,
      accepted: result.accepted,
      rejected: result.rejected,
    };
  } catch (error) {
    await repository.updateEmailEvent(event._id, {
      status: "failed",
      error: String(error.message || error).slice(0, 1000),
      processedAt: new Date(),
    });
    logger.error("Email delivery failed", {
      eventId: String(event._id),
      ticketId: ticketId ? String(ticketId) : null,
      error: error.message,
    });
    throw error;
  }
}

async function listEmailEvents(query = {}) {
  const page = Math.max(1, Number.parseInt(query.page, 10) || 1);
  const limit = Math.min(
    100,
    Math.max(1, Number.parseInt(query.limit, 10) || 20),
  );
  return repository.listEmailEvents({
    page,
    limit,
    ticketId: query.ticketId,
    status: query.status,
    direction: query.direction,
  });
}

module.exports = { sendEmail, listEmailEvents };

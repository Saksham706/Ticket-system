const fs = require("fs");
const path = require("path");
const { enqueueEmail } = require("../../queues/email.queue");
const logger = require("../../utils/logger");

const TEMPLATE_DIR = path.resolve(__dirname, "../../templates/email");

function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, (character) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };

    return entities[character];
  });
}

function replacePlaceholders(template, values) {
  return template.replace(/\{\{([A-Z0-9_]+)\}\}/g, (match, key) => {
    return Object.prototype.hasOwnProperty.call(values, key)
      ? escapeHtml(values[key])
      : match;
  });
}

function findTemplate(keywords) {
  if (!fs.existsSync(TEMPLATE_DIR)) {
    return null;
  }

  const files = fs
    .readdirSync(TEMPLATE_DIR)
    .filter((file) => file.toLowerCase().endsWith(".html"));

  const normalizedFiles = files.map((file) => ({
    file,
    normalized: file.toLowerCase().replace(/[^a-z0-9]/g, ""),
  }));

  const match = normalizedFiles.find(({ normalized }) =>
    keywords.every((keyword) => normalized.includes(keyword)),
  );

  return match ? path.join(TEMPLATE_DIR, match.file) : null;
}

function renderTemplate(keywords, values, fallback) {
  const templatePath = findTemplate(keywords);

  if (!templatePath) {
    logger.warn("Ticket email template not found; using fallback", {
      keywords,
    });

    return fallback;
  }

  const template = fs.readFileSync(templatePath, "utf8");

  return replacePlaceholders(template, values);
}

function ticketValues(ticket, extra = {}) {
  return {
    NAME: ticket.requester?.fullName || "Customer",
    AGENT_NAME: ticket.assignedAgent?.fullName || "Support agent",
    TICKET_NUMBER: ticket.ticketNumber || "",
    TITLE: ticket.title || "",
    MESSAGE: extra.MESSAGE || "",
    STATUS: ticket.status || "",
  };
}

async function enqueueTicketEmail({
  to,
  subject,
  text,
  html,
  ticket,
  eventName,
}) {
  if (!to || !String(to).trim()) {
    console.warn("Ticket email skipped: recipient email is missing", {
      eventName,
      ticketId: ticket?._id ? String(ticket._id) : undefined,
    });

    return;
  }

  try {
    const job = await enqueueEmail(
      {
        to,
        subject,
        text,
        html,
        ticketId: ticket?._id ? String(ticket._id) : undefined,
        eventName,
      },
      {
        jobId: `${eventName}-${ticket._id}-${Date.now()}`,
      },
    );

    console.log("Ticket email queued successfully", {
      eventName,
      ticketId: String(ticket._id),
      jobId: job.id,
      recipient: to,
    });

    return job;
  } catch (error) {
    console.error("Failed to queue ticket email", {
      eventName,
      ticketId: ticket?._id ? String(ticket._id) : undefined,
      error: error.message,
    });

    // Keep ticket operations successful if email queueing fails.
    return null;
  }
}

async function ticketCreated(ticket) {
  const values = ticketValues(ticket);

  const html = renderTemplate(
    ["ticket", "created"],
    values,
    `<h2>Ticket created successfully</h2>
     <p>Hello ${escapeHtml(values.NAME)},</p>
     <p>Your ticket <strong>${escapeHtml(values.TICKET_NUMBER)}</strong>
     has been created.</p>
     <p>${escapeHtml(values.TITLE)}</p>`,
  );

  await enqueueTicketEmail({
    to: ticket.requester?.email,
    subject: `Ticket created: ${ticket.ticketNumber} - ${ticket.title}`,
    text:
      `Hello ${values.NAME},\n\n` +
      `Your ticket ${values.TICKET_NUMBER} has been created.\n` +
      `Subject: ${values.TITLE}`,
    html,
    ticket,
    eventName: "ticket-created",
  });
}

async function ticketAssigned(ticket) {
  const values = ticketValues(ticket);

  const html = renderTemplate(
    ["ticket", "assigned"],
    values,
    `<h2>Ticket assigned</h2>
     <p>Ticket <strong>${escapeHtml(values.TICKET_NUMBER)}</strong>
     has been assigned to you.</p>
     <p>${escapeHtml(values.TITLE)}</p>`,
  );

  await enqueueTicketEmail({
    to: ticket.assignedAgent?.email,
    subject: `Ticket assigned: ${ticket.ticketNumber} - ${ticket.title}`,
    text:
      `Ticket ${values.TICKET_NUMBER} has been assigned to you.\n` +
      `Subject: ${values.TITLE}`,
    html,
    ticket,
    eventName: "ticket-assigned",
  });
}

async function ticketReply(ticket, message) {
  const values = ticketValues(ticket, {
    MESSAGE: message.body || "",
  });

  const html = renderTemplate(
    ["ticket", "reply"],
    values,
    `<h2>New ticket reply</h2>
     <p>Ticket <strong>${escapeHtml(values.TICKET_NUMBER)}</strong>
     has a new reply.</p>
     <p>${escapeHtml(values.TITLE)}</p>
     <p>${escapeHtml(values.MESSAGE)}</p>`,
  );

  let recipient;

  if (message.senderRole === "customer") {
    // A customer reply should notify the assigned agent.
    recipient = ticket.assignedAgent?.email;
  } else {
    // A public support reply should notify the requester.
    recipient = ticket.requester?.email;
  }

  if (!recipient) {
    logger.warn("Ticket reply email skipped: recipient unavailable", {
      ticketId: String(ticket._id),
      senderRole: message.senderRole,
    });

    return;
  }

  await enqueueTicketEmail({
    to: recipient,
    subject: `New reply: ${ticket.ticketNumber} - ${ticket.title}`,
    text:
      `There is a new reply on ticket ${values.TICKET_NUMBER}.\n` +
      `Subject: ${values.TITLE}\n\n${values.MESSAGE}`,
    html,
    ticket,
    eventName: "ticket-reply",
  });
}

async function ticketStatusChanged(ticket, newStatus) {
  const values = ticketValues(ticket);

  let keywords;
  let subjectText;
  let eventName;

  if (newStatus === "resolved") {
    keywords = ["ticket", "resolved"];
    subjectText = "Ticket resolved";
    eventName = "ticket-resolved";
  } else if (newStatus === "closed") {
    keywords = ["ticket", "closed"];
    subjectText = "Ticket closed";
    eventName = "ticket-closed";
  } else if (newStatus === "open") {
    keywords = ["ticket", "reopened"];
    subjectText = "Ticket reopened";
    eventName = "ticket-reopened";
  } else {
    return;
  }

  const html = renderTemplate(
    keywords,
    values,
    `<h2>${escapeHtml(subjectText)}</h2>
     <p>Ticket <strong>${escapeHtml(values.TICKET_NUMBER)}</strong>
     has been ${escapeHtml(newStatus)}.</p>
     <p>${escapeHtml(values.TITLE)}</p>`,
  );

  await enqueueTicketEmail({
    to: ticket.requester?.email,
    subject: `${subjectText}: ${ticket.ticketNumber} - ${ticket.title}`,
    text:
      `Ticket ${values.TICKET_NUMBER} has been ${newStatus}.\n` +
      `Subject: ${values.TITLE}`,
    html,
    ticket,
    eventName,
  });
}

module.exports = {
  ticketCreated,
  ticketAssigned,
  ticketReply,
  ticketStatusChanged,
};

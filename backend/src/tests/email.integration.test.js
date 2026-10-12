// Focused integration-style tests for inbound email threading and idempotency.
// Persistence boundaries are mocked so the suite does not need a live IMAP server.

jest.mock("../modules/email/emailEvent.model", () => ({
  EmailEvent: { findOne: jest.fn(), create: jest.fn() },
}));
jest.mock("../modules/ticket/ticket.model", () => ({
  Ticket: { findById: jest.fn(), findOne: jest.fn() },
}));
jest.mock("../modules/ticketMessage/ticketMessage.model", () => ({
  TicketMessage: { findOne: jest.fn(), create: jest.fn() },
}));
jest.mock("../modules/ticketActivity/ticketActivity.service", () => ({
  recordActivity: jest.fn().mockResolvedValue({}),
}));
jest.mock("../services/socket.service", () => ({ notifyUser: jest.fn() }));

const { EmailEvent } = require("../modules/email/emailEvent.model");
const { Ticket } = require("../modules/ticket/ticket.model");
const { TicketMessage } = require("../modules/ticketMessage/ticketMessage.model");
const activityService = require("../modules/ticketActivity/ticketActivity.service");
const { parseInboundEmail } = require("../modules/email/emailParser");
const { findTicketForInboundEmail } = require("../modules/email/emailThreading.service");
const { processInboundEmail } = require("../modules/email/inboundEmail.service");

const requester = {
  _id: "requester-id",
  email: "customer@example.com",
  fullName: "Example Customer",
  role: "customer",
};

function makeTicket(overrides = {}) {
  return {
    _id: "ticket-id",
    ticketNumber: "TKT-2026-000001",
    title: "Login issue",
    status: "open",
    requester,
    assignedAgent: "agent-id",
    lastMessageAt: new Date("2026-01-01T00:00:00.000Z"),
    save: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

function makeEvent(overrides = {}) {
  return {
    _id: "event-id",
    status: "processing",
    save: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

function mockHeaderThread(ticket) {
  EmailEvent.findOne.mockImplementation((filter) => {
    if (filter.direction === "inbound") return Promise.resolve(null);
    return { sort: jest.fn().mockResolvedValue({ ticket: ticket._id }) };
  });
  Ticket.findById.mockReturnValue({
    populate: jest.fn().mockResolvedValue(ticket),
  });
}

beforeEach(() => jest.clearAllMocks());

test("parses sender, Message-ID, and standard reply headers", () => {
  const parsed = parseInboundEmail({
    from: { value: [{ address: "Customer@Example.com" }] },
    to: { value: [{ address: "support@example.com" }] },
    subject: "Re: TKT-2026-000001 Login issue",
    text: "It still does not work.\n> previous reply",
    messageId: "<incoming-1@example.com>",
    inReplyTo: "<outbound-1@example.com>",
    references: ["<outbound-1@example.com>"],
    date: new Date("2026-01-02T00:00:00.000Z"),
  });
  expect(parsed.sender).toBe("customer@example.com");
  expect(parsed.messageId).toBe("<incoming-1@example.com>");
  expect(parsed.inReplyTo).toBe("<outbound-1@example.com>");
  expect(parsed.text).toBe("It still does not work.");
});

test("resolves a ticket from In-Reply-To/References before subject fallback", async () => {
  const ticket = makeTicket();
  mockHeaderThread(ticket);
  const result = await findTicketForInboundEmail({
    inReplyTo: "<outbound-1@example.com>",
    references: ["<outbound-1@example.com>"],
    subject: "General question without a ticket number",
  });
  expect(result.ticket).toBe(ticket);
  expect(result.matchedBy).toBe("headers");
});

test("creates a public message and reopens a resolved ticket", async () => {
  const ticket = makeTicket({ status: "resolved" });
  mockHeaderThread(ticket);
  const event = makeEvent();
  EmailEvent.create.mockResolvedValue(event);
  TicketMessage.findOne.mockResolvedValue(null);
  TicketMessage.create.mockResolvedValue({ _id: "message-id", body: "Please reopen" });

  const result = await processInboundEmail({
    from: { value: [{ address: "customer@example.com" }] },
    to: { value: [{ address: "support@example.com" }] },
    subject: "Re: Login issue",
    text: "Please reopen",
    messageId: "<incoming-2@example.com>",
    inReplyTo: "<outbound-1@example.com>",
    references: ["<outbound-1@example.com>"],
    date: new Date("2026-01-02T00:00:00.000Z"),
  });

  expect(TicketMessage.create).toHaveBeenCalledWith(expect.objectContaining({
    ticket: ticket._id,
    sender: requester._id,
    senderRole: "customer",
    type: "public",
    source: "email",
    emailMessageId: "<incoming-2@example.com>",
  }));
  expect(ticket.status).toBe("open");
  expect(ticket.save).toHaveBeenCalled();
  expect(activityService.recordActivity).toHaveBeenCalled();
  expect(event.status).toBe("received");
  expect(result.duplicate).toBe(false);
});

test("does not create another message for a previously received Message-ID", async () => {
  EmailEvent.findOne.mockResolvedValue(makeEvent({ status: "received" }));
  const result = await processInboundEmail({
    from: { value: [{ address: "customer@example.com" }] },
    subject: "Re: TKT-2026-000001",
    text: "Duplicate body",
    messageId: "<already-seen@example.com>",
  });
  expect(result.duplicate).toBe(true);
  expect(TicketMessage.create).not.toHaveBeenCalled();
});

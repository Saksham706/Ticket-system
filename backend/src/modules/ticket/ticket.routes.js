const express = require("express");

const authMiddleware = require("../../middleware/authMiddleware");
const roleMiddleware = require("../../middleware/roleMiddleware");
const validateMiddleware = require("../../middleware/validateMiddleware");

const ticketController = require("./ticket.controller");
const ticketMessageRoutes = require("../ticketMessage/ticketMessage.routes");
const ticketActivityController = require("../ticketActivity/ticketActivity.controller");

const {
  createTicketSchema,
  updateTicketSchema,
  assignTicketSchema,
} = require("./ticket.validation");

const router = express.Router();

router.use(authMiddleware);

// List tickets
router.get("/", ticketController.listTickets);

// Create ticket
router.post(
  "/",
  roleMiddleware("customer", "agent", "admin"),
  validateMiddleware(createTicketSchema),
  ticketController.createTicket,
);

// Ticket messages
router.use("/:ticketId/messages", ticketMessageRoutes);

// Ticket activity
router.get("/:ticketId/activity", ticketActivityController.getTicketActivity);

// Assign ticket
router.post(
  "/:ticketId/assign",
  roleMiddleware("admin", "agent"),
  validateMiddleware(assignTicketSchema),
  ticketController.assignTicket,
);

// Resolve ticket
router.post(
  "/:ticketId/resolve",
  roleMiddleware("admin", "agent"),
  ticketController.resolveTicket,
);

// Reopen ticket
router.post("/:ticketId/reopen", ticketController.reopenTicket);

// Close ticket
router.post(
  "/:ticketId/close",
  roleMiddleware("admin", "agent"),
  ticketController.closeTicket,
);

// Get ticket details
router.get("/:ticketId", ticketController.getTicket);

// Update ticket
router.patch(
  "/:ticketId",
  validateMiddleware(updateTicketSchema),
  ticketController.updateTicket,
);

module.exports = router;

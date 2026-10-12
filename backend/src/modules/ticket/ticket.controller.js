const asyncHandler = require("../../utils/asyncHandler");
const ApiResponse = require("../../utils/ApiResponse");
const ticketService = require("./ticket.service");

const createTicket = asyncHandler(async (req, res) => {
  const ticket = await ticketService.createTicket(req.body, req.user);

  return res
    .status(201)
    .json(new ApiResponse(201, "Ticket created successfully", ticket));
});

const listTickets = asyncHandler(async (req, res) => {
  const result = await ticketService.listTickets(req.query, req.user);

  return res
    .status(200)
    .json(new ApiResponse(200, "Tickets fetched successfully", result));
});

const getTicket = asyncHandler(async (req, res) => {
  const ticket = await ticketService.getTicket(req.params.ticketId, req.user);

  return res
    .status(200)
    .json(new ApiResponse(200, "Ticket fetched successfully", ticket));
});

const updateTicket = asyncHandler(async (req, res) => {
  const ticket = await ticketService.updateTicket(
    req.params.ticketId,
    req.body,
    req.user,
  );

  return res
    .status(200)
    .json(new ApiResponse(200, "Ticket updated successfully", ticket));
});

const assignTicket = asyncHandler(async (req, res) => {
  const ticket = await ticketService.assignTicket(
    req.params.ticketId,
    req.body.assignedAgent,
    req.user,
  );

  return res
    .status(200)
    .json(new ApiResponse(200, "Ticket assigned successfully", ticket));
});

const resolveTicket = asyncHandler(async (req, res) => {
  const ticket = await ticketService.resolveTicket(
    req.params.ticketId,
    req.user,
  );

  return res
    .status(200)
    .json(new ApiResponse(200, "Ticket resolved successfully", ticket));
});

const reopenTicket = asyncHandler(async (req, res) => {
  const ticket = await ticketService.reopenTicket(
    req.params.ticketId,
    req.user,
  );

  return res
    .status(200)
    .json(new ApiResponse(200, "Ticket reopened successfully", ticket));
});

const closeTicket = asyncHandler(async (req, res) => {
  const ticket = await ticketService.closeTicket(req.params.ticketId, req.user);

  return res
    .status(200)
    .json(new ApiResponse(200, "Ticket closed successfully", ticket));
});

module.exports = {
  createTicket,
  listTickets,
  getTicket,
  updateTicket,
  assignTicket,
  resolveTicket,
  reopenTicket,
  closeTicket,
};

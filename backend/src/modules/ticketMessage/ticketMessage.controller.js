const asyncHandler = require("../../utils/asyncHandler");
const ApiResponse = require("../../utils/ApiResponse");
const messageService = require("./ticketMessage.service");

/**
 * Create a public reply or an internal staff note.
 * POST /api/tickets/:ticketId/messages
 */
const createMessage = asyncHandler(async (req, res) => {
  const message = await messageService.createMessage(
    req.params.ticketId,
    req.body,
    req.user,
  );

  // ApiResponse constructor order:
  // new ApiResponse(statusCode, message, data)
  return res
    .status(201)
    .json(new ApiResponse(201, "Reply added successfully", message));
});

/**
 * Fetch conversation messages.
 * GET /api/tickets/:ticketId/messages
 */
const getMessages = asyncHandler(async (req, res) => {
  const result = await messageService.getMessages(
    req.params.ticketId,
    req.query,
    req.user,
  );

  // Return the messages and pagination inside the data property.
  return res
    .status(200)
    .json(new ApiResponse(200, "Messages fetched successfully", result));
});

module.exports = {
  createMessage,
  getMessages,
};

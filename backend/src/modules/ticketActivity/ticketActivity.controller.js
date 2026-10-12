const asyncHandler = require("../../utils/asyncHandler");
const ApiResponse = require("../../utils/ApiResponse");
const activityService = require("./ticketActivity.service");
const ticketPolicy = require("../ticket/ticketPolicy");

const getTicketActivity = asyncHandler(async (req, res) => {
  const ticket = await ticketPolicy.getAccessibleTicket(
    req.params.ticketId,
    req.user
  );

  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(
    100,
    Math.max(1, Number(req.query.limit) || 20)
  );

  const result = await activityService.getTicketActivity(
    ticket._id,
    { page, limit }
  );

  return res.status(200).json(
    new ApiResponse(200, result, "Ticket activity fetched successfully")
  );
});

module.exports = {
  getTicketActivity,
};
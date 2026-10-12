const asyncHandler = require("../../utils/asyncHandler");
const ApiResponse = require("../../utils/ApiResponse");

const emailService = require("./email.service");

const listEmailEvents = asyncHandler(
  async (req, res) => {
    const data =
      await emailService.listEmailEvents(
        req.query
      );

    return res.status(200).json(
      new ApiResponse(
        200,
        data,
        "Email events fetched successfully"
      )
    );
  }
);

module.exports = {
  listEmailEvents,
};
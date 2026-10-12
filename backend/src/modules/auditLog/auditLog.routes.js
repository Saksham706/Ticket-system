const express = require("express");

const authMiddleware = require("../../middleware/authMiddleware");
const roleMiddleware = require("../../middleware/roleMiddleware");
const asyncHandler = require("../../utils/asyncHandler");
const ApiResponse = require("../../utils/ApiResponse");

const auditLogService = require("./auditLog.service");

const router = express.Router();

router.use(authMiddleware, roleMiddleware("admin"));

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const result = await auditLogService.listAuditLogs(req.query);

    return res.status(200).json(
      new ApiResponse(
        200,
        "Audit logs fetched successfully",
        result.logs,
        result.pagination,
      ),
    );
  }),
);

module.exports = router;
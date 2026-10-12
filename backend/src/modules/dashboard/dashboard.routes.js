const express = require("express");

const authMiddleware = require("../../middleware/authMiddleware");
const asyncHandler = require("../../utils/asyncHandler");
const controller = require("./dashboard.controller");

const router = express.Router();

router.use(authMiddleware);

router.get("/summary", asyncHandler(controller.getDashboard));

module.exports = router;

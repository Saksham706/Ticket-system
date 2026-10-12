const express = require("express");

const authMiddleware = require("../../middleware/authMiddleware");
const validateMiddleware = require("../../middleware/validateMiddleware");

const controller = require("./ticketMessage.controller");
const { createMessageSchema } = require("./ticketMessage.validation");

const router = express.Router({ mergeParams: true });

router.use(authMiddleware);

router.get("/", controller.getMessages);

router.post(
  "/",
  validateMiddleware(createMessageSchema),
  controller.createMessage
);

module.exports = router;
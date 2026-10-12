const express = require("express");

const authMiddleware =
  require("../../middleware/authMiddleware");

const roleMiddleware =
  require("../../middleware/roleMiddleware");

const controller = require("./email.controller");

const router = express.Router();

router.use(
  authMiddleware,
  roleMiddleware("admin")
);

router.get(
  "/events",
  controller.listEmailEvents
);

module.exports = router;
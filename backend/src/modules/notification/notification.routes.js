const express = require("express");

const authMiddleware =
  require("../../middleware/authMiddleware");

const controller = require("./notification.controller");

const router = express.Router();

router.use(authMiddleware);

router.get("/", controller.listNotifications);

router.get(
  "/unread-count",
  controller.getUnreadCount
);

router.patch(
  "/read-all",
  controller.markAllAsRead
);

router.patch(
  "/:notificationId/read",
  controller.markAsRead
);

router.delete(
  "/:notificationId",
  controller.removeNotification
);

module.exports = router;
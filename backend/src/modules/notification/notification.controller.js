
const asyncHandler = require("../../utils/asyncHandler");
const ApiResponse = require("../../utils/ApiResponse");
const notificationService = require("./notification.service");

const createNotification = asyncHandler(async (req, res) => {
  const notification = await notificationService.createNotification(
    req.body
  );

  return res.status(201).json(
    new ApiResponse(
      201,
      notification,
      "Notification created successfully"
    )
  );
});

const listNotifications = asyncHandler(async (req, res) => {
  const result = await notificationService.listNotifications(
    req.user,
    req.query
  );

  return res.status(200).json(
    new ApiResponse(
      200,
      result,
      "Notifications fetched successfully"
    )
  );
});

const markAsRead = asyncHandler(async (req, res) => {
  const notification = await notificationService.markAsRead(
    req.params.notificationId,
    req.user
  );

  return res.status(200).json(
    new ApiResponse(
      200,
      notification,
      "Notification marked as read"
    )
  );
});

const markAllAsRead = asyncHandler(async (req, res) => {
  const result = await notificationService.markAllAsRead(req.user);

  return res.status(200).json(
    new ApiResponse(
      200,
      result,
      "All notifications marked as read"
    )
  );
});

const getUnreadCount = asyncHandler(async (req, res) => {
  const result = await notificationService.getUnreadCount(req.user);

  return res.status(200).json(
    new ApiResponse(
      200,
      result,
      "Unread notification count fetched successfully"
    )
  );
});

const removeNotification = asyncHandler(async (req, res) => {
  const result = await notificationService.removeNotification(
    req.params.notificationId,
    req.user
  );

  return res.status(200).json(
    new ApiResponse(
      200,
      result,
      "Notification deleted successfully"
    )
  );
});

module.exports = {
  createNotification,
  listNotifications,
  markAsRead,
  markAllAsRead,
  getUnreadCount,
  removeNotification,
};

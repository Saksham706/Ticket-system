const mongoose = require("mongoose");
const ApiError = require("../../utils/ApiError");
const repository = require("./notification.repository");

function getUserId(user) {
  const id = user?.id || user?._id;

  if (!id || !mongoose.isValidObjectId(id)) {
    throw new ApiError(401, "Invalid authenticated user ID");
  }

  return new mongoose.Types.ObjectId(id);
}

async function createNotification(data) {
  if (!data.user || !mongoose.isValidObjectId(data.user)) {
    throw new ApiError(400, "Valid notification recipient is required");
  }

  if (!data.type || !data.title || !data.message) {
    throw new ApiError(
      400,
      "Notification type, title, and message are required",
    );
  }

  return repository.createNotification({
    user: data.user,
    type: data.type,
    title: data.title,
    message: data.message,
    resourceType: data.resourceType || null,
    resourceId: data.resourceId || null,
  });
}

async function listNotifications(user, query = {}) {
  const userId = user?._id || user?.id;

  console.log("NOTIFICATION LIST DEBUG:", {
    userId: String(userId),
    userIdType: typeof userId,
    role: user?.role,
    query,
  });

  try {
    const page = Math.max(
      1,
      Number.parseInt(query.page, 10) || 1
    );

    const limit = Math.min(
      100,
      Math.max(1, Number.parseInt(query.limit, 10) || 20)
    );

    const unreadOnly =
      query.unreadOnly === true ||
      query.unreadOnly === "true";

    return await repository.listNotifications(userId, {
      page,
      limit,
      unreadOnly,
    });
  } catch (error) {
    console.error("NOTIFICATION LIST FAILURE:", {
      name: error.name,
      message: error.message,
      field: error.path,
      value: error.value,
      kind: error.kind,
      stack: error.stack,
    });

    throw error;
  }
}

async function markAsRead(notificationId, user) {
  if (!mongoose.isValidObjectId(notificationId)) {
    throw new ApiError(400, "Invalid notification ID");
  }

  const notification = await repository.markNotificationRead(
    notificationId,
    getUserId(user),
  );

  if (!notification) {
    throw new ApiError(404, "Notification not found");
  }

  return notification;
}

async function markAllAsRead(user) {
  const result = await repository.markAllNotificationsRead(getUserId(user));

  return {
    modifiedCount: result.modifiedCount,
  };
}

async function removeNotification(notificationId, user) {
  if (!mongoose.isValidObjectId(notificationId)) {
    throw new ApiError(400, "Invalid notification ID");
  }

  const notification = await repository.deleteNotification(
    notificationId,
    getUserId(user),
  );

  if (!notification) {
    throw new ApiError(404, "Notification not found");
  }

  return {
    message: "Notification deleted successfully",
  };
}

async function getUnreadCount(user) {
  const count = await repository.countUnreadNotifications(getUserId(user));

  return { unreadCount: count };
}

module.exports = {
  createNotification,
  listNotifications,
  markAsRead,
  markAllAsRead,
  removeNotification,
  getUnreadCount,
};

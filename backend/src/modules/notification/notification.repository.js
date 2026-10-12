const { Notification } = require("./notification.model");

async function createNotification(data) {
  return Notification.create(data);
}

async function listNotifications(
  userId,
  { page = 1, limit = 20, unreadOnly = false } = {},
) {
  const filter = {
    user: userId,
  };

  if (unreadOnly) {
    filter.isRead = false;
  }

  const [notifications, total] = await Promise.all([
    Notification.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),

    Notification.countDocuments(filter),
  ]);

  return {
    notifications,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
}

async function findNotificationForUser(notificationId, userId) {
  return Notification.findOne({
    _id: notificationId,
    user: userId,
  });
}

async function markNotificationRead(notificationId, userId) {
  return Notification.findOneAndUpdate(
    {
      _id: notificationId,
      user: userId,
    },
    {
      $set: {
        isRead: true,
        readAt: new Date(),
      },
    },
    {
      new: true,
    },
  );
}

async function markAllNotificationsRead(userId) {
  return Notification.updateMany(
    {
      user: userId,
      isRead: false,
    },
    {
      $set: {
        isRead: true,
        readAt: new Date(),
      },
    },
  );
}

async function deleteNotification(notificationId, userId) {
  return Notification.findOneAndDelete({
    _id: notificationId,
    user: userId,
  });
}

async function countUnreadNotifications(userId) {
  return Notification.countDocuments({
    user: userId,
    isRead: false,
  });
}

module.exports = {
  createNotification,
  listNotifications,
  findNotificationForUser,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  countUnreadNotifications,
};

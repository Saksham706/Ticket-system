const {
  notificationQueue,
} = require("./queueManager");

async function enqueueNotification(
  payload,
  options = {}
) {
  return notificationQueue.add(
    "create-notification",
    payload,
    {
      ...options,
      jobId: options.jobId,
    }
  );
}

module.exports = {
  enqueueNotification,
  notificationQueue,
};
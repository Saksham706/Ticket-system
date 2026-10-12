const { emailQueue } = require("../../queues/queueManager");

async function queueEmail(payload, options = {}) {
  return emailQueue.add("send-email", payload, {
    attempts: 5,
    backoff: {
      type: "exponential",
      delay: 2000,
    },
    removeOnComplete: 1000,
    removeOnFail: false,
    ...options,
  });
}

module.exports = {
  queueEmail,
};

const { emailQueue } = require("./queueManager");

async function enqueueEmail(payload, options = {}) {
  return emailQueue.add(
    "send-email",
    payload,
    {
      ...options,
      jobId: options.jobId,
    }
  );
}

module.exports = {
  enqueueEmail,
  emailQueue,
};
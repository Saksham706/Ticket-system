const { deadLetterQueue } = require("./queueManager");

async function sendToDeadLetter({ queue, job, error }) {
  return deadLetterQueue.add("failed-job", {
    sourceQueue: queue,
    jobName: job?.name,
    jobId: job?.id,
    data: job?.data,
    error: error?.message || String(error),
    failedAt: new Date().toISOString(),
  });
}

module.exports = {
  sendToDeadLetter,
  deadLetterQueue,
};

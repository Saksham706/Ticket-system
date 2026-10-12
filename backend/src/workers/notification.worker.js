const { Worker } = require("bullmq");
const {
  redisConnection,
} = require("../config/redis");

const notificationService =
  require("../modules/notification/notification.service");

const {
  sendToDeadLetter,
} = require("../queues/deadLetter.queue");

const logger = require("../utils/logger");

const worker = new Worker(
  "ticketing-notification",
  async (job) => {
    if (job.name !== "create-notification") {
      throw new Error(
        `Unsupported notification job: ${job.name}`
      );
    }

    return notificationService.createNotification(
      job.data
    );
  },
  {
    connection: redisConnection,
    concurrency: 10,
  }
);

worker.on("failed", async (job, error) => {
  logger.error("Notification job failed", {
    jobId: job?.id,
    error: error.message,
  });

  if (
    job &&
    job.attemptsMade >= (job.opts.attempts || 1)
  ) {
    try {
      await sendToDeadLetter({
        queue: "ticketing-notification",
        job,
        error,
      });
    } catch (deadError) {
      logger.error(
        "Could not dead-letter notification",
        { error: deadError.message }
      );
    }
  }
});

module.exports = worker;
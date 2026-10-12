const { Worker } = require("bullmq");
const { redisConnection } = require("../config/redis");

const emailService = require("../modules/email/email.service");
const { sendToDeadLetter } = require("../queues/deadLetter.queue");

const logger = require("../utils/logger");

const worker = new Worker(
  "ticketing-email",
  async (job) => {
    if (job.name !== "send-email") {
      throw new Error(`Unsupported email job: ${job.name}`);
    }

    return emailService.sendEmail(job.data);
  },
  {
    connection: redisConnection,
    concurrency: 5,
  },
);

worker.on("failed", async (job, error) => {
  logger.error("Email job failed", {
    jobId: job?.id,
    error: error.message,
  });

  if (job && job.attemptsMade >= (job.opts.attempts || 1)) {
    try {
      await sendToDeadLetter({
        queue: "ticketing-email",
        job,
        error,
      });
    } catch (deadError) {
      logger.error("Could not dead-letter email", { error: deadError.message });
    }
  }
});

module.exports = worker;

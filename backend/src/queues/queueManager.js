const { Queue } = require("bullmq");
const { redisConnection } = require("../config/redis");

const defaultJobOptions = {
  attempts: 5,
  backoff: {
    type: "exponential",
    delay: 2000,
  },
  removeOnComplete: 1000,
  removeOnFail: false,
};

const emailQueue = new Queue("ticketing-email", {
  connection: redisConnection,
  defaultJobOptions,
});

const notificationQueue = new Queue("ticketing-notification", {
  connection: redisConnection,
  defaultJobOptions,
});

const deadLetterQueue = new Queue("ticketing-dead-letter", {
  connection: redisConnection,
});

async function closeQueues() {
  await Promise.all([
    emailQueue.close(),
    notificationQueue.close(),
    deadLetterQueue.close(),
  ]);
}

module.exports = {
  emailQueue,
  notificationQueue,
  deadLetterQueue,
  closeQueues,
};

const env = require("./config/env");

const logger = require("./utils/logger");

const { connectDatabase, disconnectDatabase } = require("./config/database");

const { connectRedis, disconnectRedis } = require("./config/redis");

let shuttingDown = false;

async function startWorker() {
  try {
    await connectDatabase();

    await connectRedis();

    require("./workers/email.worker");

    require("./workers/notification.worker");

    require("./workers/inboundEmail.worker");

    logger.info("Background workers started", {
      environment: env.NODE_ENV,
    });
  } catch (error) {
    logger.error("Failed to start background workers", {
      message: error.message,

      stack: error.stack,
    });

    await disconnectRedis().catch(() => {});

    await disconnectDatabase().catch(() => {});

    process.exitCode = 1;
  }
}

async function shutdown(signal) {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;

  logger.info("Worker shutdown started", {
    signal,
  });

  try {
    // Worker-specific graceful shutdown will be added
    // when the BullMQ workers are implemented.

    await disconnectRedis();

    await disconnectDatabase();

    logger.info("Worker shutdown completed");

    process.exitCode = 0;
  } catch (error) {
    logger.error("Worker shutdown failed", {
      message: error.message,
    });

    process.exitCode = 1;
  }
}

process.on("SIGINT", () => shutdown("SIGINT"));

process.on("SIGTERM", () => shutdown("SIGTERM"));

startWorker();

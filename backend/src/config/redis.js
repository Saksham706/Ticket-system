const IORedis = require("ioredis");

const env = require("./env");

const logger = require("../utils/logger");

const redisConnection = new IORedis({
  host: env.REDIS_HOST,
  port: env.REDIS_PORT,

  password: env.REDIS_PASSWORD || undefined,

  maxRetriesPerRequest: null,

  enableReadyCheck: true,

  lazyConnect: true,
});

redisConnection.on("connect", () => {
  logger.info("Redis connection established");
});

redisConnection.on("ready", () => {
  logger.info("Redis is ready");
});

redisConnection.on("error", (error) => {
  logger.error("Redis connection error", {
    message: error.message,
  });
});

async function connectRedis() {
  if (redisConnection.status === "ready") {
    return;
  }

  if (redisConnection.status === "wait") {
    await redisConnection.connect();
  }

  if (redisConnection.status !== "ready") {
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        cleanup();

        reject(new Error("Redis connection timed out"));
      }, 10000);

      function cleanup() {
        clearTimeout(timeout);

        redisConnection.off("ready", onReady);

        redisConnection.off("error", onError);
      }

      function onReady() {
        cleanup();

        resolve();
      }

      function onError(error) {
        cleanup();

        reject(error);
      }

      redisConnection.once("ready", onReady);

      redisConnection.once("error", onError);
    });
  }
}

async function disconnectRedis() {
  if (redisConnection.status !== "end") {
    await redisConnection.quit();
  }
}

module.exports = {
  redisConnection,
  connectRedis,
  disconnectRedis,
};

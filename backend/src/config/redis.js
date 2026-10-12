const IORedis = require("ioredis");

const env = require("./env");
const logger = require("../utils/logger");

const redisUrl = process.env.REDIS_URL;

if (process.env.NODE_ENV === "production" && !redisUrl) {
  throw new Error("REDIS_URL is required in production");
}

const redisConnection = redisUrl
  ? new IORedis(redisUrl, {
      maxRetriesPerRequest: null,
      enableReadyCheck: true,
      lazyConnect: true,
      connectTimeout: 10000,
    })
  : new IORedis({
      host: env.REDIS_HOST || "127.0.0.1",
      port: Number(env.REDIS_PORT || 6379),
      password: env.REDIS_PASSWORD || undefined,
      maxRetriesPerRequest: null,
      enableReadyCheck: true,
      lazyConnect: true,
      connectTimeout: 10000,
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
    code: error.code,
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
const http = require("http");

const app = require("./app");
const env = require("./config/env");
const logger = require("./utils/logger");

const { connectDatabase, disconnectDatabase } = require("./config/database");

const { connectRedis, disconnectRedis } = require("./config/redis");

const { initializeSocket } = require("./services/socket.service");

// Import the existing BullMQ email worker.
// Importing this module creates the worker and starts listening
// to the existing "ticketing-email" queue.
const emailWorker = require("./workers/email.worker");

let server;
let shuttingDown = false;

async function startServer() {
  try {
    // Connect to MongoDB.
    await connectDatabase();

    // Connect to Redis before accepting requests.
    await connectRedis();

    // Create the HTTP server.
    server = http.createServer(app);

    // Initialize Socket.IO.
    initializeSocket(server);

    // Start accepting HTTP requests.
    server.listen(env.PORT, () => {
      logger.info("Ticketing API server started", {
        port: env.PORT,
        environment: env.NODE_ENV,
      });
    });

    // Log when the email worker is ready.
    emailWorker.on("ready", () => {
      logger.info("Ticket email worker is ready", {
        queue: "ticketing-email",
      });
    });

    // Log email worker errors.
    emailWorker.on("error", (error) => {
      logger.error("Ticket email worker error", {
        message: error.message,
        stack: error.stack,
      });
    });
  } catch (error) {
    logger.error("Failed to start server", {
      message: error.message,
      stack: error.stack,
    });

    try {
      await emailWorker.close();
    } catch (workerError) {
      logger.error("Failed to close email worker after startup failure", {
        message: workerError.message,
      });
    }

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

  logger.info("Graceful shutdown started", {
    signal,
  });

  const forceShutdown = setTimeout(() => {
    logger.error("Graceful shutdown timed out");
    process.exit(1);
  }, 10000);

  forceShutdown.unref();

  try {
    // Stop accepting new HTTP requests.
    if (server) {
      await new Promise((resolve, reject) => {
        server.close((error) => {
          if (error) {
            return reject(error);
          }

          resolve();
        });
      });
    }

    // Close the email worker before disconnecting Redis.
    await emailWorker.close();

    // Disconnect infrastructure after application components stop.
    await disconnectRedis();
    await disconnectDatabase();

    logger.info("Graceful shutdown completed");

    process.exitCode = 0;
  } catch (error) {
    logger.error("Shutdown failed", {
      message: error.message,
      stack: error.stack,
    });

    process.exitCode = 1;
  } finally {
    clearTimeout(forceShutdown);
  }
}

process.on("SIGINT", () => {
  shutdown("SIGINT");
});

process.on("SIGTERM", () => {
  shutdown("SIGTERM");
});

// Start the application.
startServer();

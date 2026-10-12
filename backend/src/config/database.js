const mongoose = require("mongoose");

const env = require("./env");

const logger = require("../utils/logger");

async function connectDatabase() {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  try {
    await mongoose.connect(env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
    });

    logger.info("MongoDB connected successfully");

    return mongoose.connection;
  } catch (error) {
    logger.error("MongoDB connection failed", {
      message: error.message,
    });

    throw error;
  }
}

async function disconnectDatabase() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();

    logger.info("MongoDB disconnected");
  }
}

module.exports = {
  connectDatabase,
  disconnectDatabase,
};

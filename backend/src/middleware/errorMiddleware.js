const mongoose = require("mongoose");

const ApiError = require("../utils/ApiError");

const logger = require("../utils/logger");

function errorMiddleware(error, req, res, next) {
  if (res.headersSent) {
    return next(error);
  }

  let statusCode = error.statusCode || error.status || 500;

  let message = error.message || "Internal server error";

  let errors = error.errors || [];

  if (error instanceof mongoose.Error.ValidationError) {
    statusCode = 400;

    message = "Database validation failed";

    errors = Object.values(error.errors).map((item) => ({
      field: item.path,

      message: item.message,
    }));
  }

  if (error instanceof mongoose.Error.CastError) {
    statusCode = 400;

    message = "Invalid resource identifier";
  }

  if (error.code === 11000) {
    statusCode = 409;

    message = "A record with this value already exists";

    errors = [];
  }

  const isOperationalError = error instanceof ApiError;

  if (!isOperationalError && statusCode >= 500) {
    message = "An unexpected error occurred";

    errors = [];
  }
  console.error("DEBUG ERROR:", {
    method: req.method,
    path: req.originalUrl,
    name: error.name,
    message: error.message,
    pathToField: error.path,
    value: error.value,
    kind: error.kind,
    stack: error.stack,
  });
  logger.error("Request failed", {
    requestId: req.requestId,

    method: req.method,

    path: req.originalUrl,

    statusCode,

    error: error.message,

    stack: process.env.NODE_ENV === "production" ? undefined : error.stack,
  });

  res.status(statusCode).json({
    success: false,

    statusCode,

    message,

    errors,

    requestId: req.requestId,
  });
}

module.exports = errorMiddleware;

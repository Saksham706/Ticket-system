class ApiError extends Error {
  constructor(statusCode, message, errors = []) {
    super(message);

    this.name = "ApiError";

    this.statusCode = statusCode;

    this.success = false;

    this.errors = errors;

    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = ApiError;

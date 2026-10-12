const ERROR_MESSAGES = Object.freeze({
  UNAUTHORIZED: "Authentication is required",

  FORBIDDEN: "You do not have permission to perform this action",

  NOT_FOUND: "The requested resource was not found",

  VALIDATION_ERROR: "Request validation failed",

  INTERNAL_SERVER_ERROR: "An unexpected error occurred",

  INVALID_CREDENTIALS: "Invalid email or password",

  INVALID_OR_EXPIRED_OTP: "Invalid or expired OTP",

  TICKET_NOT_FOUND: "Ticket not found",

  USER_NOT_FOUND: "User not found",
});

module.exports = ERROR_MESSAGES;
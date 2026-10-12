const rateLimit = require("express-rate-limit");

const env = require("../config/env");

const commonOptions = {
  standardHeaders: true,

  legacyHeaders: false,

  handler(req, res) {
    res.status(429).json({
      success: false,

      statusCode: 429,

      message: "Too many requests. Please try again later.",

      requestId: req.requestId,
    });
  },
};

const generalRateLimiter = rateLimit({
  ...commonOptions,

  windowMs: 15 * 60 * 1000,

  limit: env.NODE_ENV === "test" ? 10000 : 300,
});

const authRateLimiter = rateLimit({
  ...commonOptions,

  windowMs: 15 * 60 * 1000,

  limit: env.NODE_ENV === "test" ? 10000 : 10,

  skipSuccessfulRequests: false,
});

const otpRateLimiter = rateLimit({
  ...commonOptions,

  windowMs: 15 * 60 * 1000,

  limit: env.NODE_ENV === "test" ? 10000 : 5,
});

const ticketCreationRateLimiter = rateLimit({
  ...commonOptions,

  windowMs: 60 * 60 * 1000,

  limit: env.NODE_ENV === "test" ? 10000 : 20,
});

module.exports = {
  generalRateLimiter,

  authRateLimiter,

  otpRateLimiter,

  ticketCreationRateLimiter,
};
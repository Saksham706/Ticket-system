const express = require("express");

const authController = require("./auth.controller");
const validateMiddleware = require("../../middleware/validateMiddleware");

const {
  authRateLimiter,
  otpRateLimiter,
} = require("../../middleware/rateLimitMiddleware");

const {
  registerSchema,
  verifyOtpSchema,
  passwordLoginSchema,
  otpLoginSchema,
  verifyLoginOtpSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} = require("./auth.validation");

const router = express.Router();

router.post(
  "/register",
  authRateLimiter,
  validateMiddleware(registerSchema),
  authController.register,
);

router.post(
  "/verify-otp",
  otpRateLimiter,
  validateMiddleware(verifyOtpSchema),
  authController.verifyOtp,
);

router.post(
  "/login-password",
  authRateLimiter,
  validateMiddleware(passwordLoginSchema),
  authController.loginPassword,
);

router.post(
  "/login-otp",
  otpRateLimiter,
  validateMiddleware(otpLoginSchema),
  authController.loginOtp,
);

router.post(
  "/verify-login-otp",
  otpRateLimiter,
  validateMiddleware(verifyLoginOtpSchema),
  authController.verifyLoginOtp,
);

router.post("/refresh-token", authRateLimiter, authController.refreshToken);

router.post("/logout", authController.logout);

router.post(
  "/forgot-password",
  otpRateLimiter,
  validateMiddleware(forgotPasswordSchema),
  authController.forgotPassword,
);

router.post(
  "/reset-password",
  otpRateLimiter,
  validateMiddleware(resetPasswordSchema),
  authController.resetPassword,
);

module.exports = router;

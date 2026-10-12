const asyncHandler = require("../../utils/asyncHandler");
const ApiResponse = require("../../utils/ApiResponse");
const authService = require("./auth.service");

const refreshCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict",
  path: "/api/auth",
};

function setRefreshCookie(res, token) {
  res.cookie("refreshToken", token, {
    ...refreshCookieOptions,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

function clearRefreshCookie(res) {
  res.clearCookie("refreshToken", refreshCookieOptions);
}

// Register a new customer.
const register = asyncHandler(async (req, res) => {
  const result = await authService.register(req.body);

  return res
    .status(201)
    .json(new ApiResponse(201, "Registration successful", result));
});

// Verify email OTP.
const verifyOtp = asyncHandler(async (req, res) => {
  const result = await authService.verifyOtp(req.body);

  return res.status(200).json(new ApiResponse(200, result.message, result));
});

// Login using email and password.
const loginPassword = asyncHandler(async (req, res) => {
  const result = await authService.loginWithPassword(req.body, req);

  setRefreshCookie(res, result.refreshToken);

  return res.status(200).json(
    new ApiResponse(200, "Login successful", {
      user: result.user,
      accessToken: result.accessToken,
    }),
  );
});

// Request login OTP.
const loginOtp = asyncHandler(async (req, res) => {
  const result = await authService.requestLoginOtp(req.body);

  return res.status(200).json(new ApiResponse(200, result.message, result));
});

// Verify login OTP.
const verifyLoginOtp = asyncHandler(async (req, res) => {
  const result = await authService.verifyLoginOtp(req.body, req);

  setRefreshCookie(res, result.refreshToken);

  return res.status(200).json(
    new ApiResponse(200, "Login successful", {
      user: result.user,
      accessToken: result.accessToken,
    }),
  );
});

// Refresh access token.
const refreshToken = asyncHandler(async (req, res) => {
  const refreshTokenValue = req.cookies?.refreshToken || req.body?.refreshToken;

  const result = await authService.refreshToken(refreshTokenValue, req);

  setRefreshCookie(res, result.refreshToken);

  return res.status(200).json(
    new ApiResponse(200, "Token refreshed successfully", {
      accessToken: result.accessToken,
    }),
  );
});

// Logout and revoke refresh token.
const logout = asyncHandler(async (req, res) => {
  const refreshTokenValue = req.cookies?.refreshToken || req.body?.refreshToken;

  await authService.logout(refreshTokenValue);

  clearRefreshCookie(res);

  return res.status(200).json(new ApiResponse(200, "Logout successful", null));
});

// Request password-reset OTP.
const forgotPassword = asyncHandler(async (req, res) => {
  const result = await authService.forgotPassword(req.body);

  return res.status(200).json(new ApiResponse(200, result.message, result));
});

// Reset password using OTP.
const resetPassword = asyncHandler(async (req, res) => {
  const result = await authService.resetPassword(req.body);

  return res.status(200).json(new ApiResponse(200, result.message, result));
});

module.exports = {
  register,
  verifyOtp,
  loginPassword,
  loginOtp,
  verifyLoginOtp,
  refreshToken,
  logout,
  forgotPassword,
  resetPassword,
};

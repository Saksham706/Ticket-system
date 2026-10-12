const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const ApiError = require("../../utils/ApiError");
const authRepository = require("./auth.repository");

function getAccessSecret() {
  const secret = process.env.JWT_ACCESS_SECRET;

  if (!secret) {
    throw new Error("JWT_ACCESS_SECRET is not configured");
  }

  return secret;
}

function getRefreshSecret() {
  const secret = process.env.JWT_REFRESH_SECRET;

  if (!secret) {
    throw new Error("JWT_REFRESH_SECRET is not configured");
  }

  return secret;
}

function hashToken(token) {
  return crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");
}

function generateAccessToken(user) {
  return jwt.sign(
    {
      sub: user._id.toString(),
      role: user.role,
      type: "access",
    },
    getAccessSecret(),
    {
      expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || "15m",
      issuer: "ticketing-system",
      audience: "ticketing-client",
    }
  );
}

function generateRefreshToken(user) {
  return jwt.sign(
    {
      sub: user._id.toString(),
      type: "refresh",
      jti: crypto.randomUUID(),
    },
    getRefreshSecret(),
    {
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
      issuer: "ticketing-system",
      audience: "ticketing-client",
    }
  );
}

function getTokenExpiry(token) {
  const decoded = jwt.decode(token);

  if (!decoded || !decoded.exp) {
    throw new Error("Unable to determine refresh-token expiry");
  }

  return new Date(decoded.exp * 1000);
}

async function issueTokens(user, request = {}) {
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  await authRepository.createRefreshSession({
    user: user._id,
    tokenHash: hashToken(refreshToken),
    expiresAt: getTokenExpiry(refreshToken),
    userAgent: request.headers?.["user-agent"] || "",
    ipAddress: request.ip || "",
  });

  return {
    accessToken,
    refreshToken,
  };
}

async function rotateRefreshToken(refreshToken, request = {}) {
  let decoded;

  try {
    decoded = jwt.verify(refreshToken, getRefreshSecret(), {
      issuer: "ticketing-system",
      audience: "ticketing-client",
    });
  } catch {
    throw new ApiError(401, "Invalid or expired refresh token");
  }

  if (decoded.type !== "refresh") {
    throw new ApiError(401, "Invalid refresh token type");
  }

  const existingSession = await authRepository.findRefreshSession(
    hashToken(refreshToken)
  );

  if (!existingSession) {
    throw new ApiError(
      401,
      "Refresh token has been revoked or is invalid"
    );
  }

  if (existingSession.user._id.toString() !== decoded.sub) {
    throw new ApiError(401, "Refresh token does not match its session");
  }

  await authRepository.revokeRefreshSession(existingSession._id);

  return issueTokens(existingSession.user, request);
}

async function revokeRefreshToken(refreshToken) {
  if (!refreshToken) return;

  const tokenHash = hashToken(refreshToken);
  const session = await authRepository.findRefreshSession(tokenHash);

  if (session) {
    await authRepository.revokeRefreshSession(session._id);
  }
}

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  issueTokens,
  rotateRefreshToken,
  revokeRefreshToken,
  hashToken,
};
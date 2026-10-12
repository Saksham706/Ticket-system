const jwt = require("jsonwebtoken");
const env = require("../config/env");

const generateAccessToken = (user) => {
  const userId = user._id || user.id;

  if (!userId) {
    throw new Error("User ID is required to generate an access token");
  }

  if (!env.JWT_ACCESS_SECRET) {
    throw new Error("JWT_ACCESS_SECRET is not configured");
  }

  return jwt.sign(
    {
      sub: userId.toString(),
      type: "access",
      role: user.role,
    },
    env.JWT_ACCESS_SECRET,
    {
      expiresIn: env.JWT_ACCESS_EXPIRES_IN || "15m",
      algorithm: "HS256",
    }
  );
};

const verifyAccessToken = (token) => {
  if (!env.JWT_ACCESS_SECRET) {
    throw new Error("JWT_ACCESS_SECRET is not configured");
  }

  const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET, {
    algorithms: ["HS256"],
  });

  if (decoded.type !== "access") {
    throw new Error("Invalid token type");
  }

  return decoded;
};

module.exports = {
  generateAccessToken,
  verifyAccessToken,
};
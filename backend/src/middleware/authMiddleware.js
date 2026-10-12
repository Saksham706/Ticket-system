const jwt = require("jsonwebtoken");
const jwtConfig = require("../config/jwt");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");
const { User } = require("../modules/user/user.model");

const authMiddleware = asyncHandler(async (req, res, next) => {
  const authorization = req.headers.authorization;
  let token;

  if (authorization?.startsWith("Bearer ")) {
    token = authorization.slice(7).trim();
  } else if (req.cookies?.accessToken) {
    token = req.cookies.accessToken;
  }

  if (!token) throw new ApiError(401, "Authentication is required");

  let decoded;
  try {
    decoded = jwt.verify(token, jwtConfig.accessSecret, {
      algorithms: ["HS256"],
    });
  } catch (error) {
    if (error.name === "TokenExpiredError")
      throw new ApiError(401, "Access token has expired");
    throw new ApiError(401, "Invalid access token");
  }

  if (decoded.type !== "access" || !decoded.sub) {
    throw new ApiError(401, "Invalid access token");
  }

  // User schema uses fullName, not name. Keep `name` as a compatibility alias.
  const user = await User.findById(decoded.sub)
    .select(
      "_id fullName email phone role isActive isEmailVerified isPhoneVerified",
    )
    .lean();

  if (!user || !user.isActive)
    throw new ApiError(401, "User account is unavailable");
  if (!["customer", "agent", "admin"].includes(user.role)) {
    throw new ApiError(403, "Invalid account role");
  }

  req.user = {
    id: String(user._id),
    _id: String(user._id),
    fullName: user.fullName,
    name: user.fullName,
    email: user.email,
    phone: user.phone,
    role: user.role,
    isEmailVerified: user.isEmailVerified,
    isPhoneVerified: user.isPhoneVerified,
  };

  next();
});

module.exports = authMiddleware;

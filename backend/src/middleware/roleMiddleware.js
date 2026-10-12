const ApiError = require("../utils/ApiError");

function roleMiddleware(...allowedRoles) {
  return function (req, res, next) {
    if (!req.user) {
      return next(
        new ApiError(401, "Authentication is required")
      );
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new ApiError(
          403,
          "You do not have permission to perform this action"
        )
      );
    }

    next();
  };
}

module.exports = roleMiddleware;
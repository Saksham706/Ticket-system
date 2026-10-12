const ApiError = require("../utils/ApiError");

function validateMiddleware(schema, property = "body") {
  return function (req, res, next) {
    const result = schema.safeParse(req[property]);

    if (!result.success) {
      const errors = result.error.issues.map((issue) => ({
        field: issue.path.length ? issue.path.join(".") : property,
        message: issue.message,
      }));

      return next(new ApiError(400, "Request validation failed", errors));
    }

    req[property] = result.data;

    return next();
  };
}

module.exports = validateMiddleware;

const { randomUUID } = require("crypto");

function requestIdMiddleware(req, res, next) {
  const suppliedId = req.get("X-Request-ID");

  const requestId =
    suppliedId && /^[a-zA-Z0-9_-]{1,100}$/.test(suppliedId)
      ? suppliedId
      : randomUUID();

  req.requestId = requestId;

  res.setHeader("X-Request-ID", requestId);

  next();
}

module.exports = requestIdMiddleware;

const mongoSanitize = require("@exortek/express-mongo-sanitize");

const mongoSanitizeMiddleware = mongoSanitize();

module.exports = mongoSanitizeMiddleware;
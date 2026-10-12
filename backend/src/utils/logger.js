const winston = require("winston");

const env = require("../config/env");

const logger = winston.createLogger({
  level: env.LOG_LEVEL,

  format: winston.format.combine(
    winston.format.timestamp(),

    winston.format.errors({
      stack: true,
    }),

    winston.format.json(),
  ),

  defaultMeta: {
    service: "ticketing-system",
  },

  transports: [new winston.transports.Console()],
});

if (env.NODE_ENV !== "production") {
  logger.add(
    new winston.transports.File({
      filename: "logs/error.log",

      level: "error",
    }),
  );

  logger.add(
    new winston.transports.File({
      filename: "logs/combined.log",
    }),
  );
}

module.exports = logger;

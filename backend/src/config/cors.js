const env = require("./env");

const corsOptions = {
  origin(origin, callback) {
    if (!origin) {
      return callback(null, true);
    }

    if (origin === env.CLIENT_URL) {
      return callback(null, true);
    }

    return callback(new Error("Origin not allowed by CORS"));
  },

  credentials: true,

  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],

  allowedHeaders: ["Content-Type", "Authorization", "X-Request-ID"],

  exposedHeaders: ["X-Request-ID"],

  maxAge: 86400,
};

module.exports = corsOptions;

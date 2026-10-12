const env = require("./env");

const jwtConfig = {
  accessSecret: env.JWT_ACCESS_SECRET,

  accessExpiresIn: env.JWT_ACCESS_EXPIRES_IN,

  refreshSecret: env.JWT_REFRESH_SECRET,

  refreshExpiresIn: env.JWT_REFRESH_EXPIRES_IN,
};

module.exports = jwtConfig;
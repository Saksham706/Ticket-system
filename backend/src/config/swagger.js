const fs = require("fs");
const path = require("path");
const env = require("./env");

if (!env.SWAGGER_ENABLED) {
  module.exports = { swaggerUi: null, swaggerSpec: null };
} else {
  const swaggerUi = require("swagger-ui-express");
  const yaml = require("js-yaml");
  const filePath = path.join(__dirname, "..", "docs", "openapi.yaml");
  const swaggerSpec = yaml.load(fs.readFileSync(filePath, "utf8"));
  module.exports = { swaggerUi, swaggerSpec };
}

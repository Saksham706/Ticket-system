const crypto = require("crypto");

const hashValue = (value) => {
  if (typeof value !== "string" || value.length === 0) {
    throw new TypeError("Value to hash must be a non-empty string");
  }

  return crypto
    .createHash("sha256")
    .update(value)
    .digest("hex");
};

module.exports = hashValue;
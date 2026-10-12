const MESSAGE_TYPES = Object.freeze({
  PUBLIC: "public",

  INTERNAL: "internal",
});

const MESSAGE_SOURCES = Object.freeze({
  WEB: "web",

  EMAIL: "email",

  SYSTEM: "system",
});

module.exports = {
  MESSAGE_TYPES,
  MESSAGE_SOURCES,
};
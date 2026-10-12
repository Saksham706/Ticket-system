const mongoose = require("mongoose");

async function ensureIndexes() {
  await Promise.all(
    Object.values(mongoose.models).map((model) =>
      model.createIndexes()
    )
  );
}

module.exports = { ensureIndexes };
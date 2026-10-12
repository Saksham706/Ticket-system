const fs = require("fs/promises");
const path = require("path");
const crypto = require("crypto");

const root = path.resolve(
  process.env.UPLOAD_DIR || "uploads"
);

async function storeBuffer(buffer, originalName) {
  await fs.mkdir(root, { recursive: true });

  const extension = path
    .extname(originalName || "")
    .toLowerCase()
    .slice(0, 10);

  const storedName =
    `${crypto.randomUUID()}${extension}`;

  const destination = path.join(root, storedName);

  await fs.writeFile(destination, buffer, {
    flag: "wx",
  });

  return {
    storedName,
    path: destination,
    size: buffer.length,
  };
}

async function resolveStoredFile(storedName) {
  if (
    !storedName ||
    path.basename(storedName) !== storedName
  ) {
    throw new Error("Invalid stored filename");
  }

  const target = path.resolve(root, storedName);

  if (!target.startsWith(root + path.sep)) {
    throw new Error("Invalid file path");
  }

  await fs.access(target);

  return target;
}

module.exports = {
  storeBuffer,
  resolveStoredFile,
};
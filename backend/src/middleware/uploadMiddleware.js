const multer = require("multer");

const path = require("path");

const fs = require("fs");

const env = require("../config/env");

const ApiError = require("../utils/ApiError");

const uploadDirectory = path.resolve(process.cwd(), env.UPLOAD_DIR);

fs.mkdirSync(uploadDirectory, {
  recursive: true,
});

const allowedMimeTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
  "text/plain",
]);

const storage = multer.diskStorage({
  destination(req, file, callback) {
    callback(null, uploadDirectory);
  },

  filename(req, file, callback) {
    const extension = path.extname(file.originalname).toLowerCase();

    callback(null, `${require("crypto").randomUUID()}${extension}`);
  },
});

const upload = multer({
  storage,

  limits: {
    fileSize: env.MAX_FILE_SIZE_MB * 1024 * 1024,

    files: 5,
  },

  fileFilter(req, file, callback) {
    if (!allowedMimeTypes.has(file.mimetype)) {
      return callback(
        new ApiError(400, "This attachment file type is not allowed"),
      );
    }

    callback(null, true);
  },
});

module.exports = upload;

const express = require("express");

const authMiddleware = require("../../middleware/authMiddleware");

const asyncHandler = require("../../utils/asyncHandler");

const uploadMiddleware = require("../../middleware/uploadMiddleware");

const controller = require("./attachment.controller");

const router = express.Router();

const upload = uploadMiddleware.upload || uploadMiddleware;

router.use(authMiddleware);

router.post("/", upload.single("file"), controller.uploadAttachment);

router.get("/ticket/:ticketId", controller.listAttachments);

router.get("/:attachmentId/download", controller.downloadAttachment);

router.delete("/:attachmentId", controller.deleteAttachment);

module.exports = router;

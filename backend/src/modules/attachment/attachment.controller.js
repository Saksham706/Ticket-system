const path = require("path");

const asyncHandler = require("../../utils/asyncHandler");
const ApiResponse = require("../../utils/ApiResponse");

const attachmentService = require("./attachment.service");

const uploadAttachment = asyncHandler(async (req, res) => {
  const attachment = await attachmentService.uploadAttachment({
    ticketId: req.body.ticketId,
    messageId: req.body.messageId,
    file: req.file,
    user: req.user,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, attachment, "Attachment uploaded successfully"));
});

const listAttachments = asyncHandler(async (req, res) => {
  const attachments = await attachmentService.listAttachments(
    req.params.ticketId,
    req.user,
  );

  return res
    .status(200)
    .json(
      new ApiResponse(200, attachments, "Attachments fetched successfully"),
    );
});

const downloadAttachment = asyncHandler(async (req, res) => {
  const attachment = await attachmentService.getAttachmentForDownload(
    req.params.attachmentId,
    req.user,
  );

  res.setHeader("Content-Type", attachment.mimeType);

  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${path
      .basename(attachment.originalName)
      .replace(/["\r\n]/g, "_")}"`,
  );

  return res.sendFile(path.resolve(attachment.storagePath));
});

const deleteAttachment = asyncHandler(async (req, res) => {
  const result = await attachmentService.deleteAttachment(
    req.params.attachmentId,
    req.user,
  );

  return res.status(200).json(new ApiResponse(200, result));
});

module.exports = {
  uploadAttachment,
  listAttachments,
  downloadAttachment,
  deleteAttachment,
};

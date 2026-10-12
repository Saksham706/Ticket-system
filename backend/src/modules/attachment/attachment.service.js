const fs = require("fs/promises");
const path = require("path");

const ApiError = require("../../utils/ApiError");

const { Attachment } = require("./attachment.model");

const { Ticket } = require("../ticket/ticket.model");

const { TicketMessage } = require("../ticketMessage/ticketMessage.model");

const { storeBuffer } = require("../../services/storage.service");

const ticketPolicy = require("../ticket/ticketPolicy");

const attachmentRepository = require("./attachment.repository");

async function assertTicketAccess(ticketId, user) {
  const ticket = await Ticket.findById(ticketId);

  if (!ticket) {
    throw new ApiError(404, "Ticket not found");
  }

  await ticketPolicy.getAccessibleTicket(ticketId, user);

  return ticket;
}

async function uploadAttachment({ ticketId, messageId, file, user }) {
  await assertTicketAccess(ticketId, user);

  if (!file) {
    throw new ApiError(400, "File is required");
  }

  if (!file.buffer || !file.originalname) {
    throw new ApiError(400, "Invalid uploaded file");
  }

  if (messageId) {
    const message = await TicketMessage.findOne({
      _id: messageId,
      ticket: ticketId,
    });

    if (!message) {
      throw new ApiError(404, "Ticket message not found");
    }
  }

  const stored = await storeBuffer(file.buffer, file.originalname);

  try {
    return await attachmentRepository.createAttachment({
      ticket: ticketId,
      message: messageId || null,
      uploadedBy: user._id || user.id,
      originalName: path.basename(file.originalname),
      storedName: stored.storedName,
      mimeType: file.mimetype || "application/octet-stream",
      size: file.size,
      storagePath: stored.path,
    });
  } catch (error) {
    await fs.unlink(stored.path).catch(() => {});
    throw error;
  }
}

async function listAttachments(ticketId, user) {
  await assertTicketAccess(ticketId, user);

  return attachmentRepository.listAttachmentsByTicket(ticketId);
}

async function getAttachmentForDownload(attachmentId, user) {
  const attachment =
    await attachmentRepository.findAttachmentById(attachmentId);

  if (!attachment) {
    throw new ApiError(404, "Attachment not found");
  }

  await assertTicketAccess(attachment.ticket, user);

  return attachment;
}

async function deleteAttachment(attachmentId, user) {
  const attachment =
    await attachmentRepository.findAttachmentById(attachmentId);

  if (!attachment) {
    throw new ApiError(404, "Attachment not found");
  }

  await assertTicketAccess(attachment.ticket, user);

  const userId = String(user._id || user.id);
  const uploaderId = String(attachment.uploadedBy);

  const isAdmin = user.role === "admin";
  const isUploader = userId === uploaderId;

  if (!isAdmin && !isUploader) {
    throw new ApiError(403, "You cannot delete this attachment");
  }

  await attachmentRepository.deleteAttachment(attachmentId);

  await fs.unlink(attachment.storagePath).catch((error) => {
    if (error.code !== "ENOENT") {
      throw error;
    }
  });

  return {
    message: "Attachment deleted successfully",
  };
}

module.exports = {
  uploadAttachment,
  listAttachments,
  getAttachmentForDownload,
  deleteAttachment,
};

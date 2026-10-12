const { Attachment } = require("./attachment.model");

async function createAttachment(data) {
  return Attachment.create(data);
}

async function findAttachmentById(id) {
  return Attachment.findById(id).select("+storagePath");
}

async function listAttachmentsByTicket(ticketId) {
  return Attachment.find({
    ticket: ticketId,
  })
    .select("-storagePath -storedName")
    .populate("uploadedBy", "fullName email role")
    .sort({ createdAt: -1 });
}

async function deleteAttachment(id) {
  return Attachment.findByIdAndDelete(id);
}

module.exports = {
  createAttachment,
  findAttachmentById,
  listAttachmentsByTicket,
  deleteAttachment,
};

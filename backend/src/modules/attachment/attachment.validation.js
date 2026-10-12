const { z } = require("zod");

const objectIdSchema = z
  .string()
  .regex(/^[a-f\d]{24}$/i, "Invalid ID");

const uploadAttachmentSchema = z.object({
  ticketId: objectIdSchema,
  messageId: objectIdSchema.optional(),
});

module.exports = {
  uploadAttachmentSchema,
  objectIdSchema,
};
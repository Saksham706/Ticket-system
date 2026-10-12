const { z } = require("zod");

const createMessageSchema = z.object({
  body: z.string().trim().min(1).max(20000),
  type: z.enum(["public", "internal"]).optional(),
});

module.exports = {
  createMessageSchema,
};
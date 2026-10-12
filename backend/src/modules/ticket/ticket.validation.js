const { z } = require("zod");

const objectIdSchema = z
  .string()
  .regex(/^[a-f\d]{24}$/i, "Invalid ID");

const createTicketSchema = z.object({
  title: z.string().trim().min(3).max(200),
  description: z.string().trim().min(5).max(10000),
  category: objectIdSchema,
  priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
});

const updateTicketSchema = z.object({
  title: z.string().trim().min(3).max(200).optional(),
  description: z.string().trim().min(5).max(10000).optional(),
  category: objectIdSchema.optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
  status: z.enum([
    "open",
    "in_progress",
    "pending",
    "resolved",
    "closed",
  ]).optional(),
}).refine(
  (data) => Object.keys(data).length > 0,
  { message: "Provide at least one field to update" }
);

const assignTicketSchema = z.object({
  assignedAgent: objectIdSchema,
});

module.exports = {
  createTicketSchema,
  updateTicketSchema,
  assignTicketSchema,
};
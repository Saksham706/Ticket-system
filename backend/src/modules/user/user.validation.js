const { z } = require("zod");

const updateProfileSchema = z.object({
  fullName: z.string().trim().min(2).max(100).optional(),
  phone: z.string().trim().regex(/^\+?[1-9]\d{7,14}$/).optional(),
}).refine(
  (data) => Object.keys(data).length > 0,
  { message: "Provide at least one field to update" }
);

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1).max(128),
  newPassword: z.string().min(8).max(128),
});

const updateUserStatusSchema = z.object({
  isActive: z.boolean(),
});

module.exports = {
  updateProfileSchema,
  changePasswordSchema,
  updateUserStatusSchema,
};
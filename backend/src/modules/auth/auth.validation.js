const { z } = require("zod");

const registerSchema = z.object({
  fullName: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(254),
  phone: z
    .string()
    .trim()
    .regex(/^\+?[1-9]\d{7,14}$/, "Enter a valid phone number"),
  password: z.string().min(8).max(128),

  // Optional role; defaults to customer.
  role: z.enum(["customer", "agent", "admin"]).default("customer"),
});

const verifyOtpSchema = z.object({
  email: z.string().trim().email(),
  otp: z.string().regex(/^\d{6}$/),
  purpose: z.enum(["EMAIL_VERIFICATION", "PHONE_VERIFICATION"]).optional(),
});

const passwordLoginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1).max(128),
});

const otpLoginSchema = z
  .object({
    email: z.string().trim().email().optional(),
    phone: z.string().trim().optional(),
  })
  .refine((data) => Boolean(data.email || data.phone), {
    message: "Provide an email address or phone number",
  });

const verifyLoginOtpSchema = z
  .object({
    email: z.string().trim().email().optional(),
    phone: z.string().trim().optional(),
    otp: z.string().regex(/^\d{6}$/),
  })
  .refine((data) => Boolean(data.email || data.phone), {
    message: "Provide an email address or phone number",
  });

const forgotPasswordSchema = z.object({
  email: z.string().trim().email(),
});

const resetPasswordSchema = z.object({
  email: z.string().trim().email(),
  otp: z.string().regex(/^\d{6}$/),
  newPassword: z.string().min(8).max(128),
});

module.exports = {
  registerSchema,
  verifyOtpSchema,
  passwordLoginSchema,
  otpLoginSchema,
  verifyLoginOtpSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
};

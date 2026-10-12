require("dotenv").config();

const { z } = require("zod");

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),

  PORT: z.coerce.number().int().positive().default(5000),

  API_PREFIX: z.string().default("/api"),

  CLIENT_URL: z.string().url(),

  MONGODB_URI: z.string().min(1),

  REDIS_HOST: z.string().default("127.0.0.1"),

  REDIS_PORT: z.coerce.number().int().positive().default(6379),

  REDIS_PASSWORD: z.string().optional().default(""),

  JWT_ACCESS_SECRET: z.string().min(32),

  JWT_ACCESS_EXPIRES_IN: z.string().default("15m"),

  JWT_REFRESH_SECRET: z.string().min(32),

  JWT_REFRESH_EXPIRES_IN: z.string().default("7d"),

  OTP_EXPIRES_IN_MINUTES: z.coerce.number().int().positive().default(5),

  OTP_MAX_ATTEMPTS: z.coerce.number().int().positive().default(5),

  OTP_RESEND_COOLDOWN_SECONDS: z.coerce.number().int().positive().default(60),

  SMTP_HOST: z.string().optional().default(""),

  SMTP_PORT: z.coerce.number().int().positive().default(587),

  SMTP_SECURE: z
    .enum(["true", "false"])
    .default("false")
    .transform((value) => value === "true"),

  SMTP_USER: z.string().optional().default(""),

  SMTP_PASSWORD: z.string().optional().default(""),

  SMTP_FROM_EMAIL: z.string().optional().default(""),

  IMAP_HOST: z.string().optional().default(""),

  IMAP_PORT: z.coerce.number().int().positive().default(993),

  IMAP_SECURE: z
    .enum(["true", "false"])
    .default("true")
    .transform((value) => value === "true"),

  IMAP_USER: z.string().optional().default(""),

  IMAP_PASSWORD: z.string().optional().default(""),

  IMAP_MAILBOX: z.string().default("INBOX"),

  TWILIO_ACCOUNT_SID: z.string().optional().default(""),

  TWILIO_AUTH_TOKEN: z.string().optional().default(""),

  TWILIO_PHONE_NUMBER: z.string().optional().default(""),

  UPLOAD_DIR: z.string().default("uploads"),

  MAX_FILE_SIZE_MB: z.coerce.number().positive().default(5),

  LOG_LEVEL: z.string().default("info"),

  INBOUND_EMAIL_ENABLED: z
    .enum(["true", "false"])
    .default("false")
    .transform((value) => value === "true"),

  INBOUND_EMAIL_WEBHOOK_SECRET: z.string().optional().default(""),

  SWAGGER_ENABLED: z
    .enum(["true", "false"])
    .default("true")
    .transform((value) => value === "true"),
});

const result = envSchema.safeParse(process.env);

if (!result.success) {
  console.error(
    "Invalid environment configuration:",
    result.error.flatten().fieldErrors,
  );

  process.exit(1);
}

module.exports = result.data;

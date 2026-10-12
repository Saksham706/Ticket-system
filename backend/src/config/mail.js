const nodemailer = require("nodemailer");

const env = require("./env");

let transporter = null;

function getMailTransporter() {
  if (transporter) {
    return transporter;
  }

  if (!env.SMTP_HOST || !env.SMTP_USER || !env.SMTP_PASSWORD) {
    throw new Error("SMTP configuration is incomplete");
  }

  transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,

    port: env.SMTP_PORT,

    secure: env.SMTP_SECURE,

    auth: {
      user: env.SMTP_USER,

      pass: env.SMTP_PASSWORD,
    },
  });

  return transporter;
}

async function verifyMailConnection() {
  const mailTransporter = getMailTransporter();

  await mailTransporter.verify();

  return true;
}

module.exports = {
  getMailTransporter,
  verifyMailConnection,
};

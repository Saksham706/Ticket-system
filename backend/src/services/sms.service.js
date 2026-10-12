const twilio = require("twilio");

const getTwilioClient = () => {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;

  if (!accountSid || !authToken) {
    throw new Error(
      "Twilio credentials are missing from the environment configuration"
    );
  }

  return twilio(accountSid, authToken);
};

const sendSms = async ({ to, message }) => {
  if (!to || !message) {
    throw new Error("Recipient phone number and message are required");
  }

  const from = process.env.TWILIO_PHONE_NUMBER;

  if (!from) {
    throw new Error("TWILIO_PHONE_NUMBER is not configured");
  }

  const client = getTwilioClient();

  return client.messages.create({
    body: message,
    from,
    to,
  });
};

module.exports = {
  sendSms,
};
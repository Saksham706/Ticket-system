const EMAIL_STATUS = Object.freeze({
  PENDING: "pending",
  PROCESSING: "processing",
  SENT: "sent",
  FAILED: "failed",
  DELIVERED: "delivered",
  BOUNCED: "bounced",
});

module.exports = EMAIL_STATUS;
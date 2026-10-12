const { ImapFlow } = require("imapflow");
const { simpleParser } = require("mailparser");
const env = require("../../config/env");
const inboundEmailService = require("./inboundEmail.service");
const logger = require("../../utils/logger");

function getImapConfig() {
  if (!env.IMAP_HOST || !env.IMAP_USER || !env.IMAP_PASSWORD) {
    throw new Error(
      "IMAP_HOST, IMAP_USER, and IMAP_PASSWORD must be configured",
    );
  }
  return {
    host: env.IMAP_HOST,
    port: env.IMAP_PORT,
    secure: env.IMAP_SECURE,
    auth: { user: env.IMAP_USER, pass: env.IMAP_PASSWORD },
    logger: false,
  };
}

async function pollInbox() {
  const client = new ImapFlow(getImapConfig());
  await client.connect();

  try {
    const lock = await client.getMailboxLock(env.IMAP_MAILBOX || "INBOX");
    try {
      for await (const message of client.fetch(
        { seen: false },
        { uid: true, source: true, envelope: true },
      )) {
        let markSeen = false;
        try {
          const parsed = await simpleParser(message.source);
          await inboundEmailService.processInboundEmail(parsed);
          markSeen = true;
        } catch (error) {
          const status = Number(error.statusCode || error.status || 0);
          logger.error("Inbound email processing failed", {
            uid: message.uid,
            messageId: message.envelope?.messageId,
            statusCode: status || undefined,
            error: error.message,
          });

          // Permanent malformed/unmatched/unauthorized messages should not be
          // retried forever. Transient server/database failures stay unread.
          if (status >= 400 && status < 500) markSeen = true;
        }

        if (markSeen) {
          await client.messageFlagsAdd(message.uid, ["\\Seen"], { uid: true });
        }
      }
    } finally {
      lock.release();
    }
  } finally {
    await client.logout().catch((error) => {
      logger.warn("IMAP logout failed", { error: error.message });
    });
  }
}

module.exports = { pollInbox, getImapConfig };

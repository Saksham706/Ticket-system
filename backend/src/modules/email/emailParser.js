function normalizeAddress(address) {
  if (!address) return "";
  if (typeof address === "string") return address.trim().toLowerCase();
  if (typeof address.address === "string")
    return address.address.trim().toLowerCase();
  return "";
}

function extractSender(message) {
  const value = message?.from?.value;
  if (Array.isArray(value) && value.length > 0)
    return normalizeAddress(value[0]);
  return normalizeAddress(message?.from);
}

function extractRecipients(message) {
  const values = message?.to?.value;
  if (Array.isArray(values))
    return values.map(normalizeAddress).filter(Boolean);
  if (typeof message?.to === "string") {
    return message.to.split(",").map(normalizeAddress).filter(Boolean);
  }
  return [];
}

function normalizeMessageId(value) {
  if (!value) return "";
  if (Array.isArray(value))
    return value.map(normalizeMessageId).filter(Boolean).join(" ");
  return String(value).trim();
}

function stripQuotedReply(text = "") {
  const lines = String(text).replace(/\r\n/g, "\n").split("\n");
  const kept = [];
  for (const line of lines) {
    if (/^\s*>/.test(line)) break;
    if (/^\s*On .{1,200}wrote:\s*$/i.test(line)) break;
    if (/^\s*-{2,}\s*Original Message\s*-{2,}\s*$/i.test(line)) break;
    if (/^\s*From:\s.+$/i.test(line) && kept.length > 0) break;
    kept.push(line);
  }
  return kept.join("\n").trim();
}

function parseInboundEmail(message) {
  const references = Array.isArray(message?.references)
    ? message.references.map(normalizeMessageId).filter(Boolean)
    : message?.references
      ? String(message.references)
          .split(/\s+/)
          .map(normalizeMessageId)
          .filter(Boolean)
      : [];

  const text = stripQuotedReply(message?.text || "");
  const html = typeof message?.html === "string" ? message.html : "";

  return {
    sender: extractSender(message),
    recipients: extractRecipients(message),
    subject: String(message?.subject || "").trim(),
    text,
    html,
    messageId: normalizeMessageId(message?.messageId),
    inReplyTo: normalizeMessageId(message?.inReplyTo),
    references,
    receivedAt: message?.date instanceof Date ? message.date : new Date(),
  };
}

module.exports = {
  normalizeAddress,
  extractSender,
  extractRecipients,
  stripQuotedReply,
  parseInboundEmail,
};

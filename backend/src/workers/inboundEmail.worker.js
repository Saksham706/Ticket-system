const env = require("../config/env");
const logger = require("../utils/logger");
const { pollInbox } = require("../modules/email/imap.service");

const POLL_INTERVAL_MS = Math.max(
  10_000,
  Number(process.env.INBOUND_EMAIL_POLL_INTERVAL_MS || 30_000),
);

let timer = null;
let polling = false;
let stopped = false;

async function runPoll() {
  if (stopped || polling || !env.INBOUND_EMAIL_ENABLED) return;
  polling = true;
  try {
    await pollInbox();
  } catch (error) {
    logger.error("Inbound email inbox poll failed", { error: error.message });
  } finally {
    polling = false;
  }
}

function startInboundEmailWorker() {
  if (!env.INBOUND_EMAIL_ENABLED) {
    logger.info("Inbound email worker disabled (INBOUND_EMAIL_ENABLED=false)");
    return;
  }
  if (timer) return;
  stopped = false;
  logger.info("Inbound email worker started", { pollIntervalMs: POLL_INTERVAL_MS });
  void runPoll();
  timer = setInterval(() => void runPoll(), POLL_INTERVAL_MS);
  timer.unref?.();
}

function stopInboundEmailWorker() {
  stopped = true;
  if (timer) clearInterval(timer);
  timer = null;
}

// Requiring this worker from src/worker.js starts it when enabled.
startInboundEmailWorker();

module.exports = { startInboundEmailWorker, stopInboundEmailWorker };

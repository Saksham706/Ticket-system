const repository = require("./ticketActivity.repository");

async function recordActivity({
  ticketId,
  actorId,
  action,
  description,
  changes = {},
}) {
  return repository.createActivity({
    ticket: ticketId,
    actor: actorId || null,
    action,
    description,
    changes,
  });
}

async function getTicketActivity(ticketId, pagination) {
  return repository.listByTicket(ticketId, pagination);
}

module.exports = {
  recordActivity,
  getTicketActivity,
};
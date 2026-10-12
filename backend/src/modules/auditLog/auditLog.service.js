const ApiError = require("../../utils/ApiError");
const auditLogRepository = require("./auditLog.repository");

async function listAuditLogs(query = {}) {
  const page = Math.max(1, Number.parseInt(query.page, 10) || 1);

  const limit = Math.min(
    100,
    Math.max(1, Number.parseInt(query.limit, 10) || 20),
  );

  if (query.actorId && !/^[a-f\d]{24}$/i.test(query.actorId)) {
    throw new ApiError(400, "Invalid actorId");
  }

  return auditLogRepository.listAuditLogs({
    page,
    limit,
    actorId: query.actorId,
    action: query.action,
  });
}

module.exports = {
  listAuditLogs,
};
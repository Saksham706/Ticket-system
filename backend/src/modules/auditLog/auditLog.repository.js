const { AuditLog } = require("./auditLog.model");

async function listAuditLogs({
  page = 1,
  limit = 20,
  actorId,
  action,
} = {}) {
  const filter = {};

  if (actorId) {
    filter.actor = actorId;
  }

  if (action) {
    filter.action = action.trim();
  }

  const [logs, total] = await Promise.all([
    AuditLog.find(filter)
      .populate("actor", "fullName email role")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),

    AuditLog.countDocuments(filter),
  ]);

  return {
    logs,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
}

module.exports = {
  listAuditLogs,
};
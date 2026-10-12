const { AuditLog } = require("../modules/auditLog/auditLog.model");

async function recordAudit({
  actor,
  action,
  resourceType,
  resourceId,
  metadata = {},
  ipAddress = "",
}) {
  if (!action || !resourceType) {
    throw new Error(
      "Audit logging failed: action and resourceType are required",
    );
  }

  const record = await AuditLog.create({
    actor: actor || null,
    action,
    resourceType,
    resourceId: resourceId ? String(resourceId) : null,
    metadata,
    ipAddress,
  });

  console.log("[AUDIT CREATED]", {
    id: record._id.toString(),
    action: record.action,
    resourceType: record.resourceType,
  });

  return record;
}

module.exports = {
  recordAudit,
};
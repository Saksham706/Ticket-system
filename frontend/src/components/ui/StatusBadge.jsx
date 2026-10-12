const labels = {
  open: "Open", pending: "Pending", in_progress: "In progress", "in progress": "In progress",
  resolved: "Resolved", closed: "Closed", reopened: "Reopened"
};
export default function StatusBadge({ status }) {
  const key = String(status || "open").toLowerCase();
  const cls = {
    open: "badge-blue", pending: "badge-amber", in_progress: "badge-violet", "in progress": "badge-violet",
    resolved: "badge-green", closed: "badge-gray", reopened: "badge-rose"
  }[key] || "badge-gray";
  return <span className={`badge ${cls}`}>{labels[key] || status || "Open"}</span>;
}

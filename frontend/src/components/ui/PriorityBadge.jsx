export default function PriorityBadge({ priority }) {
  const key = String(priority || "medium").toLowerCase();
  const cls = { low: "text-slate-500", medium: "text-blue-600", high: "text-orange-600", urgent: "text-rose-600" }[key] || "text-slate-500";
  return <span className={`inline-flex items-center gap-1.5 text-xs font-semibold capitalize ${cls}`}><span className="h-1.5 w-1.5 rounded-full bg-current" />{key}</span>;
}

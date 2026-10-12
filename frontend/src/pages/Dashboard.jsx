import { useEffect, useState } from "react";
import {
  ArrowUpRight,
  CheckCircle2,
  CircleDashed,
  Clock3,
  Plus,
  RefreshCw,
  Ticket,
  TrendingUp,
} from "lucide-react";
import { Link } from "react-router-dom";
import client, { payload } from "../api/client";
import endpoints from "../api/endpoints";
import StatusBadge from "../components/ui/StatusBadge";
import LoadingScreen from "../components/ui/LoadingScreen";
import { useAuth } from "../context/AuthContext";

const countsDefault = {
  open: 0,
  pending: 0,
  in_progress: 0,
  resolved: 0,
  closed: 0,
  reopened: 0,
};
function extractDashboard(raw) {
  const d = raw?.stats || raw?.statistics || raw?.summary || raw || {};
  const overview = d.overview || d;
  const counts = {
    open: Number(
      overview.open ?? overview.openTickets ?? d.ticketsByStatus?.open ?? 0,
    ),
    pending: Number(
      overview.pending ??
        overview.pendingTickets ??
        d.ticketsByStatus?.pending ??
        0,
    ),
    in_progress: Number(
      overview.in_progress ??
        overview.inProgressTickets ??
        d.ticketsByStatus?.in_progress ??
        0,
    ),
    resolved: Number(
      overview.resolved ??
        overview.resolvedTickets ??
        d.ticketsByStatus?.resolved ??
        0,
    ),
    closed: Number(
      overview.closed ??
        overview.closedTickets ??
        d.ticketsByStatus?.closed ??
        0,
    ),
    reopened: Number(overview.reopened ?? d.ticketsByStatus?.reopened ?? 0),
    total: Number(overview.totalTickets ?? overview.total ?? 0),
    unassigned: Number(overview.unassignedTickets ?? 0),
    assigned: Number(overview.assignedTickets ?? 0),
    users: Number(overview.totalUsers ?? 0),
  };
  return {
    counts,
    recent: d.recentTickets || raw?.recentTickets || [],
    recentMessages: d.recentMessages || [],
  };
}
export default function Dashboard() {
  const [data, setData] = useState(null),
    [loading, setLoading] = useState(true);
  const { user, isStaff, isAdmin } = useAuth();
  async function load() {
    setLoading(true);
    try {
      const res = await client.get(endpoints.dashboard);
      setData(extractDashboard(payload(res)));
    } catch {
      setData({ counts: countsDefault, recent: [] });
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    load();
  }, []);
  if (loading) return <LoadingScreen label="Loading your dashboard..." />;
  const tiles = [
    ...(data.counts.total
      ? [["Total", data.counts.total, Ticket, "bg-indigo-50 text-indigo-600"]]
      : []),
    ["Open", data.counts.open, CircleDashed, "bg-blue-50 text-blue-600"],
    ["Pending", data.counts.pending, Clock3, "bg-amber-50 text-amber-600"],
    [
      "In progress",
      data.counts.in_progress,
      Ticket,
      "bg-violet-50 text-violet-600",
    ],
    [
      "Resolved",
      data.counts.resolved,
      CheckCircle2,
      "bg-emerald-50 text-emerald-600",
    ],
    ["Closed", data.counts.closed, CheckCircle2, "bg-slate-100 text-slate-600"],
    ["Reopened", data.counts.reopened, RefreshCw, "bg-rose-50 text-rose-600"],
  ];
  return (
    <div className="space-y-7">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="eyebrow">OVERVIEW</p>
          <h1 className="page-title">
            Good to see you, {(user?.fullName || "there").split(" ")[0]}.
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            {isAdmin
              ? "Monitor platform-wide ticket activity and support operations."
              : isStaff
                ? "Work through assigned conversations and keep customers informed."
                : "Track your support requests and continue your conversations."}
          </p>
        </div>
        <Link to="/tickets/new" className="btn-primary">
          <Plus size={17} /> Create ticket
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        {tiles.map(([label, value, Icon, cls]) => (
          <div key={label} className="panel p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <div
                className={`grid h-9 w-9 place-items-center rounded-xl ${cls}`}
              >
                <Icon size={18} />
              </div>
              <ArrowUpRight size={15} className="text-slate-300" />
            </div>
            <div className="mt-5 text-2xl font-bold tracking-tight text-slate-900">
              {value}
            </div>
            <div className="mt-1 text-xs font-medium text-slate-500 sm:text-sm">
              {label} tickets
            </div>
          </div>
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <section className="panel overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 sm:px-6">
            <div>
              <h2 className="section-title">Recent tickets</h2>
              <p className="mt-1 text-xs text-slate-400">
                Latest support conversations
              </p>
            </div>
            <Link
              to="/tickets"
              className="text-sm font-semibold text-indigo-600 hover:text-indigo-700"
            >
              View all <span aria-hidden>→</span>
            </Link>
          </div>
          {data.recent.length ? (
            <div className="divide-y divide-slate-100">
              {data.recent.slice(0, 6).map((t) => (
                <Link
                  key={t._id || t.id}
                  to={`/tickets/${t._id || t.id}`}
                  className="flex items-center justify-between gap-3 px-5 py-4 hover:bg-slate-50 sm:px-6"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-800">
                      {t.title || t.subject || "Untitled ticket"}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      {t.ticketNumber || t.number || "Ticket"} ·{" "}
                      {new Date(
                        t.updatedAt || t.createdAt || Date.now(),
                      ).toLocaleDateString()}
                    </p>
                  </div>
                  <StatusBadge status={t.status} />
                </Link>
              ))}
            </div>
          ) : (
            <div className="px-6 py-12 text-center">
              <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-indigo-50 text-indigo-600">
                <Ticket size={22} />
              </div>
              <p className="mt-4 font-semibold text-slate-800">
                No recent tickets
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Create a ticket to start a conversation.
              </p>
              <Link
                to="/tickets/new"
                className="mt-4 inline-flex text-sm font-semibold text-indigo-600"
              >
                Create your first ticket →
              </Link>
            </div>
          )}
        </section>
        <section className="panel p-5 sm:p-6">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-indigo-50 text-indigo-600">
              <TrendingUp size={20} />
            </div>
            <div>
              <h2 className="section-title">Your workspace</h2>
              <p className="text-xs text-slate-400">Support at a glance</p>
            </div>
          </div>
          <div className="mt-6 space-y-4">
            {isAdmin && (
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-xs text-slate-500">Active users</p>
                  <p className="mt-1 text-xl font-bold">{data.counts.users}</p>
                </div>
                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-xs text-slate-500">Unassigned tickets</p>
                  <p className="mt-1 text-xl font-bold">
                    {data.counts.unassigned}
                  </p>
                </div>
              </div>
            )}
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-800">
                Email-connected support
              </p>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                Customers can reply directly to ticket emails. Incoming replies
                are added to the same ticket by the backend.
              </p>
            </div>
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-800">
                Signed in as
              </p>
              <p className="mt-1 text-sm text-slate-500">{user?.email}</p>
              <span className="mt-3 inline-flex rounded-full bg-white px-2.5 py-1 text-xs font-semibold capitalize text-indigo-700 ring-1 ring-slate-200">
                {user?.role || "customer"}
              </span>
            </div>
            {isStaff && (
              <Link
                to="/tickets?status=open"
                className="flex items-center justify-between rounded-xl border border-indigo-100 bg-indigo-50/60 p-4 text-sm font-semibold text-indigo-700"
              >
                Review open tickets <ArrowUpRight size={16} />
              </Link>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

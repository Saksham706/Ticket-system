import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  Filter,
  Plus,
  Search,
  SlidersHorizontal,
  Ticket as TicketIcon,
} from "lucide-react";
import client, { payload } from "../api/client";
import endpoints from "../api/endpoints";
import StatusBadge from "../components/ui/StatusBadge";
import PriorityBadge from "../components/ui/PriorityBadge";
import LoadingScreen from "../components/ui/LoadingScreen";
import { useAuth } from "../context/AuthContext";

function listFrom(raw) {
  return Array.isArray(raw)
    ? raw
    : raw?.tickets || raw?.items || raw?.results || [];
}
export default function Tickets() {
  const [params, setParams] = useSearchParams();
  const [tickets, setTickets] = useState([]),
    [pagination, setPagination] = useState(null),
    [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(params.get("search") || ""),
    [status, setStatus] = useState(params.get("status") || ""),
    [priority, setPriority] = useState(params.get("priority") || ""),
    [category, setCategory] = useState(params.get("category") || ""),
    [categories, setCategories] = useState([]),
    [assignedAgent, setAssignedAgent] = useState(
      params.get("assignedAgent") || "",
    );
  const { isStaff, isAdmin, user } = useAuth();
  useEffect(() => {
    client
      .get(endpoints.categories)
      .then((r) => {
        const d = payload(r);
        setCategories(Array.isArray(d) ? d : d?.categories || d?.items || []);
      })
      .catch(() => {});
  }, []);
  async function load() {
    setLoading(true);
    try {
      const res = await client.get(endpoints.tickets, {
        params: {
          page: Number(params.get("page") || 1),
          limit: 10,
          ...(search ? { search } : {}),
          ...(status ? { status } : {}),
          ...(priority ? { priority } : {}),
          ...(category ? { category } : {}),
          ...(assignedAgent ? { assignedAgent } : {}),
        },
      });
      const data = payload(res);
      setTickets(listFrom(data));
      setPagination(data?.pagination || null);
    } catch {
      setTickets([]);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    load();
  }, [params.toString()]);
  function submitSearch(e) {
    e.preventDefault();
    const next = {};
    if (search) next.search = search;
    if (status) next.status = status;
    if (priority) next.priority = priority;
    if (category) next.category = category;
    if (assignedAgent) next.assignedAgent = assignedAgent;
    setParams(next);
  }
  const emptyTitle =
    search || status || priority ? "No matching tickets" : "No tickets yet";
  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="eyebrow">SUPPORT QUEUE</p>
          <h1 className="page-title">Tickets</h1>
          <p className="mt-2 text-sm text-slate-500">
            Search, filter, and manage your support conversations.
          </p>
        </div>
        <Link to="/tickets/new" className="btn-primary">
          <Plus size={17} /> New ticket
        </Link>
      </div>
      <form
        onSubmit={submitSearch}
        className="panel grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-[1.4fr_150px_150px_180px_180px_auto] sm:p-5"
      >
        <div className="relative">
          <Search size={17} className="absolute left-3 top-3 text-slate-400" />
          <input
            className="input pl-10"
            placeholder="Search ticket number or subject..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="input"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="">All statuses</option>
          <option value="open">Open</option>
          <option value="pending">Pending</option>
          <option value="in_progress">In progress</option>
          <option value="resolved">Resolved</option>
          <option value="reopened">Reopened</option>
          <option value="closed">Closed</option>
        </select>
        <select
          className="input"
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
        >
          <option value="">All priorities</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="urgent">Urgent</option>
        </select>
        <select
          className="input"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c._id} value={c._id}>
              {c.name}
            </option>
          ))}
        </select>
        {isStaff && (
          <input
            className="input"
            placeholder="Assigned agent ID"
            value={assignedAgent}
            onChange={(e) => setAssignedAgent(e.target.value)}
          />
        )}
        <button className="btn-primary">
          <SlidersHorizontal size={16} /> Apply
        </button>
      </form>
      <section className="panel overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <h2 className="section-title">
              {isAdmin
                ? "All tickets"
                : isStaff
                  ? "Support queue"
                  : "My tickets"}
            </h2>
            <p className="mt-1 text-xs text-slate-400">
              {pagination?.total ?? tickets.length} results
            </p>
          </div>
          <div className="text-xs text-slate-400">
            <Filter size={14} className="mr-1 inline" /> Live data
          </div>
        </div>
        {loading ? (
          <LoadingScreen label="Loading tickets..." />
        ) : tickets.length ? (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-400">
                  <tr>
                    <th className="px-6 py-3 font-semibold">Ticket</th>
                    <th className="px-4 py-3 font-semibold">Requester</th>
                    <th className="px-4 py-3 font-semibold">Priority</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-6 py-3 font-semibold">Updated</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {tickets.map((t) => (
                    <tr key={t._id} className="hover:bg-slate-50">
                      <td className="px-6 py-4">
                        <Link
                          to={`/tickets/${t._id}`}
                          className="block max-w-[360px] truncate text-sm font-semibold text-slate-800 hover:text-indigo-600"
                        >
                          {t.title || t.subject || "Untitled ticket"}
                        </Link>
                        <p className="mt-1 text-xs text-slate-400">
                          {t.ticketNumber || t._id}
                        </p>
                      </td>
                      <td className="px-4 py-4 text-sm text-slate-600">
                        {t.requester?.fullName ||
                          t.requester?.name ||
                          t.requester?.email ||
                          "—"}
                      </td>
                      <td className="px-4 py-4">
                        <PriorityBadge priority={t.priority} />
                      </td>
                      <td className="px-4 py-4">
                        <StatusBadge status={t.status} />
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-500">
                        {new Date(
                          t.updatedAt || t.createdAt,
                        ).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="divide-y divide-slate-100 md:hidden">
              {tickets.map((t) => (
                <Link
                  key={t._id}
                  to={`/tickets/${t._id}`}
                  className="block p-4 hover:bg-slate-50"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-800">
                        {t.title || t.subject}
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        {t.ticketNumber || t._id}
                      </p>
                    </div>
                    <StatusBadge status={t.status} />
                  </div>
                  <div className="mt-3 flex justify-between">
                    <PriorityBadge priority={t.priority} />
                    <span className="text-xs text-slate-400">
                      {new Date(
                        t.updatedAt || t.createdAt,
                      ).toLocaleDateString()}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
            {pagination?.pages > 1 && (
              <div className="flex items-center justify-between border-t border-slate-100 px-5 py-4">
                <span className="text-xs text-slate-500">
                  Page {pagination.page} of {pagination.pages}
                </span>
                <div className="flex gap-2">
                  <button
                    className="btn-secondary px-3 py-2"
                    disabled={pagination.page <= 1}
                    onClick={() =>
                      setParams({
                        ...Object.fromEntries(params),
                        page: String(pagination.page - 1),
                      })
                    }
                  >
                    Previous
                  </button>
                  <button
                    className="btn-secondary px-3 py-2"
                    disabled={pagination.page >= pagination.pages}
                    onClick={() =>
                      setParams({
                        ...Object.fromEntries(params),
                        page: String(pagination.page + 1),
                      })
                    }
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="px-6 py-16 text-center">
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-slate-100 text-slate-500">
              <TicketIcon size={22} />
            </div>
            <p className="mt-4 font-semibold text-slate-800">{emptyTitle}</p>
            <p className="mt-1 text-sm text-slate-500">
              Try adjusting your filters or create a new ticket.
            </p>
            <Link
              to="/tickets/new"
              className="mt-4 inline-flex text-sm font-semibold text-indigo-600"
            >
              Create a ticket →
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}

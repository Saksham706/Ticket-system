import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Check,
  Mail,
  MessageSquare,
  Paperclip,
  RefreshCw,
  Send,
  UserRound,
  XCircle,
} from "lucide-react";
import { toast } from "react-toastify";

import client, { payload } from "../api/client";
import endpoints from "../api/endpoints";
import StatusBadge from "../components/ui/StatusBadge";
import PriorityBadge from "../components/ui/PriorityBadge";
import LoadingScreen from "../components/ui/LoadingScreen";
import { useAuth } from "../context/AuthContext";

/* =========================================================
   RESPONSE HELPERS
========================================================= */

function getId(value) {
  if (!value) return null;

  if (typeof value === "string") return value;

  if (typeof value === "object") {
    if (value._id) return String(value._id);
    if (value.id) return String(value.id);
  }

  return String(value);
}

function unwrapResponse(response) {
  let value = response?.data ?? response;

  for (let i = 0; i < 5; i += 1) {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      break;
    }

    if (value.data !== undefined) {
      value = value.data;
      continue;
    }

    if (value.result !== undefined) {
      value = value.result;
      continue;
    }

    if (value.payload !== undefined) {
      value = value.payload;
      continue;
    }

    break;
  }

  return value;
}

function extractArray(value, preferredKey) {
  if (!value) return [];

  if (Array.isArray(value)) return value;

  if (typeof value !== "object") return [];

  const keys = [
    preferredKey,
    "items",
    "results",
    "docs",
    "records",
    "data",
    "result",
    "payload",
  ].filter(Boolean);

  for (const key of keys) {
    if (Array.isArray(value[key])) {
      return value[key];
    }
  }

  for (const key of keys) {
    if (value[key] && typeof value[key] === "object") {
      const result = extractArray(value[key], preferredKey);

      if (result.length > 0) {
        return result;
      }
    }
  }

  return [];
}

function extractMessages(response) {
  const unwrapped = unwrapResponse(response);

  const candidates = [
    unwrapped?.messages,
    unwrapped?.items,
    unwrapped?.results,
    unwrapped?.docs,
    unwrapped?.records,
    unwrapped?.data?.messages,
    unwrapped?.result?.messages,
    response?.data?.messages,
    response?.data?.data?.messages,
  ];

  let messages = candidates.find(Array.isArray);

  if (!messages) {
    messages = extractArray(unwrapped, "messages");
  }

  return messages
    .filter((message) => message && typeof message === "object")
    .map((message) => ({
      ...message,
      type:
        message.type || (message.isInternal === true ? "internal" : "public"),
    }))
    .sort((a, b) => {
      const first = new Date(a.createdAt || 0).getTime();
      const second = new Date(b.createdAt || 0).getTime();

      return first - second;
    });
}

function getMessageType(message) {
  if (
    message?.type === "internal" ||
    message?.isInternal === true ||
    message?.visibility === "internal"
  ) {
    return "internal";
  }

  return "public";
}

function getMessageBody(message) {
  return message?.body ?? message?.content ?? message?.message ?? "";
}

/* =========================================================
   TICKET DETAIL
========================================================= */

export default function TicketDetail() {
  const { ticketId } = useParams();
  const { user, isStaff, isAdmin } = useAuth();

  const [ticket, setTicket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [activity, setActivity] = useState([]);
  const [attachments, setAttachments] = useState([]);
  const [agents, setAgents] = useState([]);

  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const [body, setBody] = useState("");
  const [internal, setInternal] = useState(false);

  const [assignee, setAssignee] = useState("");
  const [newPriority, setNewPriority] = useState("medium");

  const currentUserId = getId(user);
  const currentRole = String(user?.role || "").toLowerCase();

  /* =======================================================
     LOAD TICKET AND CONVERSATION
  ======================================================= */

  const load = useCallback(
    async ({ showLoading = true } = {}) => {
      if (!ticketId) {
        setLoading(false);
        return;
      }

      if (showLoading) {
        setLoading(true);
      }

      try {
        const ticketResponse = await client.get(endpoints.ticket(ticketId));

        const ticketData = unwrapResponse(ticketResponse);

        const currentTicket =
          ticketData?.ticket || ticketData?.data?.ticket || ticketData;

        if (!currentTicket?._id) {
          throw new Error("Ticket details were not returned by the backend.");
        }

        setTicket(currentTicket);

        const assignedAgentId = getId(currentTicket.assignedAgent);

        const canSeeInternal =
          currentRole === "admin" ||
          (currentRole === "agent" &&
            Boolean(
              currentUserId &&
              assignedAgentId &&
              currentUserId === assignedAgentId,
            ));

        const [messagesResult, activityResult, attachmentsResult] =
          await Promise.allSettled([
            client.get(endpoints.messages(ticketId), {
              params: {
                includeInternal: canSeeInternal ? "true" : "false",
                limit: 100,
                _t: Date.now(),
              },
            }),

            client.get(endpoints.activity(ticketId)),

            client.get(endpoints.ticketAttachments(ticketId)),
          ]);

        /* Load messages */

        if (messagesResult.status === "fulfilled") {
          const loadedMessages = extractMessages(messagesResult.value);

          console.debug("Ticket conversation loaded", {
            ticketId,
            role: currentRole,
            includeInternal: canSeeInternal,
            messageCount: loadedMessages.length,
            internalCount: loadedMessages.filter(
              (message) => getMessageType(message) === "internal",
            ).length,
          });

          setMessages(loadedMessages);
        } else {
          console.error(
            "Failed to load ticket messages:",
            messagesResult.reason?.response?.data ||
              messagesResult.reason?.message,
          );

          toast.error(
            messagesResult.reason?.response?.data?.message ||
              "Failed to load conversation messages.",
          );
        }

        /* Load activity */

        if (activityResult.status === "fulfilled") {
          setActivity(extractArray(unwrapResponse(activityResult.value)));
        } else {
          setActivity([]);

          console.error(
            "Failed to load ticket activity:",
            activityResult.reason?.message,
          );
        }

        /* Load attachments */

        if (attachmentsResult.status === "fulfilled") {
          setAttachments(extractArray(unwrapResponse(attachmentsResult.value)));
        } else {
          setAttachments([]);

          console.error(
            "Failed to load attachments:",
            attachmentsResult.reason?.message,
          );
        }

        setAssignee(assignedAgentId || "");

        setNewPriority(currentTicket.priority || "medium");
      } catch (error) {
        console.error(
          "Failed to load ticket:",
          error.response?.data || error.message,
        );

        toast.error(
          error.response?.data?.message ||
            error.message ||
            "Failed to load ticket.",
        );
      } finally {
        setLoading(false);
      }
    },
    [ticketId, currentRole, currentUserId],
  );

  useEffect(() => {
    load();
  }, [load]);

  /* =======================================================
     LOAD AGENTS FOR ADMIN
  ======================================================= */

  useEffect(() => {
    if (!isAdmin) {
      setAgents([]);
      return;
    }

    let active = true;

    async function loadAgents() {
      try {
        const response = await client.get(endpoints.users, {
          params: {
            role: "agent",
            page: 1,
            limit: 100,
          },
        });

        const data = unwrapResponse(response);

        const agentList = extractArray(data);

        if (active) {
          setAgents(
            agentList.filter(
              (agent) =>
                String(agent.role || "").toLowerCase() === "agent" &&
                agent.isActive !== false,
            ),
          );
        }
      } catch (error) {
        console.error(
          "Failed to load agents:",
          error.response?.data || error.message,
        );

        if (active) {
          setAgents([]);
        }
      }
    }

    loadAgents();

    return () => {
      active = false;
    };
  }, [isAdmin]);

  /* =======================================================
     SEND PUBLIC REPLY OR INTERNAL NOTE
  ======================================================= */

  async function sendReply(event) {
    event.preventDefault();

    const trimmedBody = body.trim();

    if (!trimmedBody) {
      toast.error("Please enter a message.");
      return;
    }

    if (internal && !["admin", "agent"].includes(currentRole)) {
      toast.error("Only support staff can create internal notes.");
      return;
    }

    if (
      internal &&
      currentRole === "agent" &&
      getId(ticket?.assignedAgent) !== currentUserId
    ) {
      toast.error("Only the assigned agent can add an internal note.");
      return;
    }

    setSending(true);

    const messageType = internal ? "internal" : "public";

    try {
      const response = await client.post(endpoints.messages(ticketId), {
        body: trimmedBody,
        type: messageType,
      });

      /*
       * The backend returns:
       *
       * ApiResponse({
       *   data: savedMessage
       * })
       *
       * Unwrap that response and show the saved message.
       */

      const savedMessage = unwrapResponse(response);

      const message =
        savedMessage?.message || savedMessage?.data?.message || savedMessage;

      if (
        message &&
        typeof message === "object" &&
        (message._id || message.id)
      ) {
        const normalizedMessage = {
          ...message,
          type: message.type || messageType,
          body: message.body || trimmedBody,
          sender: message.sender || {
            _id: currentUserId,
            fullName: user?.fullName || user?.name || user?.email || "You",
            role: currentRole,
          },
        };

        setMessages((previous) => {
          const messageId = getId(normalizedMessage);

          if (messageId && previous.some((item) => getId(item) === messageId)) {
            return previous;
          }

          return [...previous, normalizedMessage].sort(
            (a, b) =>
              new Date(a.createdAt || 0).getTime() -
              new Date(b.createdAt || 0).getTime(),
          );
        });
      }

      setBody("");
      setInternal(false);

      toast.success(
        messageType === "internal" ? "Internal note added" : "Reply sent",
      );

      /*
       * Refresh from the database after sending.
       * Do not clear the current messages while refreshing.
       */

      await load({ showLoading: false });
    } catch (error) {
      console.error(
        "Failed to send message:",
        error.response?.data || error.message,
      );

      toast.error(error.response?.data?.message || "Failed to send message.");
    } finally {
      setSending(false);
    }
  }

  /* =======================================================
     UPDATE PRIORITY
  ======================================================= */

  async function updatePriority(event) {
    event.preventDefault();

    try {
      await client.patch(endpoints.ticket(ticketId), {
        priority: newPriority,
      });

      toast.success("Priority updated.");

      await load({ showLoading: false });
    } catch (error) {
      console.error(
        "Failed to update priority:",
        error.response?.data || error.message,
      );

      toast.error(
        error.response?.data?.message || "Failed to update priority.",
      );
    }
  }

  /* =======================================================
     STATUS ACTIONS
  ======================================================= */

  async function action(kind) {
    const routes = {
      resolve: endpoints.resolve(ticketId),
      reopen: endpoints.reopen(ticketId),
      close: endpoints.close(ticketId),
    };

    if (!routes[kind]) return;

    try {
      await client.post(routes[kind], {});

      toast.success(
        `Ticket ${
          kind === "resolve"
            ? "resolved"
            : kind === "reopen"
              ? "reopened"
              : "closed"
        }.`,
      );

      await load({ showLoading: false });
    } catch (error) {
      console.error(
        `Failed to ${kind} ticket:`,
        error.response?.data || error.message,
      );

      toast.error(error.response?.data?.message || `Failed to ${kind} ticket.`);
    }
  }

  /* =======================================================
     ASSIGN TICKET
  ======================================================= */

  async function assign(event) {
    event.preventDefault();

    if (!assignee) {
      toast.error("Select an agent first.");
      return;
    }

    try {
      await client.post(endpoints.assign(ticketId), {
        assignedAgent: assignee,
      });

      toast.success("Ticket assigned successfully.");

      await load({ showLoading: false });
    } catch (error) {
      console.error(
        "Failed to assign ticket:",
        error.response?.data || error.message,
      );

      toast.error(error.response?.data?.message || "Failed to assign ticket.");
    }
  }

  /* =======================================================
     ATTACHMENTS
  ======================================================= */

  async function uploadAttachment(event) {
    const file = event.target.files?.[0];

    if (!file) return;

    const formData = new FormData();

    formData.append("file", file);
    formData.append("ticketId", ticketId);

    try {
      await client.post(endpoints.attachments, formData);

      toast.success("Attachment uploaded.");

      await load({ showLoading: false });
    } catch (error) {
      console.error("Upload failed:", error.response?.data || error.message);

      toast.error(error.response?.data?.message || "Attachment upload failed.");
    } finally {
      event.target.value = "";
    }
  }

  async function downloadAttachment(attachment) {
    try {
      const response = await client.get(
        endpoints.attachmentDownload(attachment._id),
        {
          responseType: "blob",
        },
      );

      const url = URL.createObjectURL(response.data);

      const link = document.createElement("a");

      link.href = url;

      link.download =
        attachment.originalName || attachment.filename || "attachment";

      document.body.appendChild(link);
      link.click();
      link.remove();

      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download failed:", error.response?.data || error.message);

      toast.error("Failed to download attachment.");
    }
  }

  /* =======================================================
     LOADING AND NOT FOUND
  ======================================================= */

  if (loading) {
    return <LoadingScreen label="Loading ticket conversation..." />;
  }

  if (!ticket) {
    return (
      <div className="panel p-10 text-center">
        <h2 className="section-title">Ticket unavailable</h2>

        <p className="mt-2 text-sm text-slate-500">
          The ticket may not exist or you may not have permission to view it.
        </p>

        <Link
          to="/tickets"
          className="mt-5 inline-flex text-sm font-semibold text-indigo-600"
        >
          Back to tickets
        </Link>
      </div>
    );
  }

  /* =======================================================
     DERIVED STATE
  ======================================================= */

  const status = String(ticket.status || "open").toLowerCase();

  const assignedAgentId = getId(ticket.assignedAgent);

  const isAssignedAgent =
    currentRole === "agent" &&
    Boolean(
      currentUserId && assignedAgentId && currentUserId === assignedAgentId,
    );

  const canSeeInternal = currentRole === "admin" || isAssignedAgent;

  const visibleMessages = messages.filter(
    (message) => canSeeInternal || getMessageType(message) !== "internal",
  );

  const canReopen = ["resolved", "closed"].includes(status);

  const canResolve = isStaff && !["resolved", "closed"].includes(status);

  const canClose = isStaff && status !== "closed";

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="space-y-6">
      {/* Back navigation */}

      <Link
        to="/tickets"
        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-800"
      >
        <ArrowLeft size={16} />
        Back to tickets
      </Link>

      {/* Ticket heading */}

      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-md bg-slate-100 px-2 py-1 font-mono text-xs text-slate-500">
              {ticket.ticketNumber || ticket._id}
            </span>

            <StatusBadge status={ticket.status} />

            <PriorityBadge priority={ticket.priority} />
          </div>

          <h1 className="mt-3 break-words text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            {ticket.title || ticket.subject}
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Created {new Date(ticket.createdAt || Date.now()).toLocaleString()}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {canResolve && (
            <button
              type="button"
              onClick={() => action("resolve")}
              className="btn-secondary"
            >
              <Check size={16} />
              Resolve
            </button>
          )}

          {canReopen && (
            <button
              type="button"
              onClick={() => action("reopen")}
              className="btn-secondary"
            >
              <RefreshCw size={16} />
              Reopen
            </button>
          )}

          {canClose && (
            <button
              type="button"
              onClick={() => action("close")}
              className="btn-secondary text-rose-600"
            >
              <XCircle size={16} />
              Close
            </button>
          )}
        </div>
      </div>

      {/* Main layout */}

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="space-y-5">
          {/* WhatsApp-style conversation */}

          <section className="panel overflow-hidden">
            <div className="border-b border-slate-100 px-5 py-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="section-title">Conversation</h2>

                  <p className="mt-1 text-xs text-slate-400">
                    Public replies are visible to the requester. Internal notes
                    are visible only to authorized staff.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => load({ showLoading: false })}
                  className="btn-secondary"
                  title="Refresh conversation"
                >
                  <RefreshCw size={15} />
                </button>
              </div>
            </div>

            <div className="space-y-5 bg-slate-50/50 p-4 sm:p-6">
              {/* Original ticket message */}

              <div className="flex items-start gap-3">
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-indigo-100 text-indigo-700">
                  <UserRound size={17} />
                </div>

                <div className="max-w-[90%] rounded-2xl rounded-tl-sm border border-slate-100 bg-white p-4 shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <span className="text-sm font-semibold text-slate-800">
                      {ticket.requester?.fullName ||
                        ticket.requester?.name ||
                        "Requester"}
                    </span>

                    <span className="text-[11px] text-slate-400">
                      {new Date(
                        ticket.createdAt || Date.now(),
                      ).toLocaleString()}
                    </span>
                  </div>

                  <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-slate-700">
                    {ticket.description || "No description provided."}
                  </p>
                </div>
              </div>

              {/* Conversation messages */}

              {visibleMessages.map((message, index) => {
                const sender =
                  message.sender || message.author || message.user || {};

                const privateNote = getMessageType(message) === "internal";

                const senderId = getId(message.sender);

                const isOwnMessage = Boolean(
                  senderId && currentUserId && senderId === currentUserId,
                );

                return (
                  <div
                    key={
                      message._id ||
                      message.id ||
                      `${message.createdAt}-${index}`
                    }
                    className={`flex items-start gap-3 ${
                      isOwnMessage && !privateNote
                        ? "justify-end"
                        : "justify-start"
                    }`}
                  >
                    {!(isOwnMessage && !privateNote) && (
                      <div
                        className={`grid h-9 w-9 shrink-0 place-items-center rounded-full ${
                          privateNote
                            ? "bg-amber-100 text-amber-700"
                            : "bg-emerald-100 text-emerald-700"
                        }`}
                      >
                        {privateNote ? (
                          <UserRound size={17} />
                        ) : (
                          <MessageSquare size={17} />
                        )}
                      </div>
                    )}

                    <div
                      className={`max-w-[90%] rounded-2xl p-4 shadow-sm ${
                        privateNote
                          ? "rounded-tl-sm border border-amber-300 bg-amber-50"
                          : isOwnMessage
                            ? "rounded-tr-sm bg-indigo-100"
                            : "rounded-tl-sm border border-slate-100 bg-white"
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-semibold text-slate-800">
                            {sender.fullName ||
                              sender.name ||
                              sender.email ||
                              message.senderEmail ||
                              "Support"}
                          </span>

                          {privateNote && (
                            <span className="rounded-md bg-amber-200 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-amber-900">
                              Internal note · Staff only
                            </span>
                          )}

                          {(message.source === "email" ||
                            message.channel === "email") && (
                            <span className="inline-flex items-center gap-1 text-[10px] text-slate-500">
                              <Mail size={11} />
                              Email
                            </span>
                          )}
                        </div>

                        <span className="text-[11px] text-slate-500">
                          {new Date(
                            message.createdAt ||
                              message.receivedAt ||
                              Date.now(),
                          ).toLocaleString()}
                        </span>
                      </div>

                      <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-slate-700">
                        {getMessageBody(message)}
                      </p>

                      {Array.isArray(message.attachments) &&
                        message.attachments.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {message.attachments.map(
                              (attachment, attachmentIndex) => (
                                <a
                                  key={attachment._id || attachmentIndex}
                                  href={
                                    attachment.url || attachment.path || "#"
                                  }
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-indigo-600"
                                >
                                  <Paperclip size={13} />

                                  {attachment.originalName ||
                                    attachment.filename ||
                                    "Attachment"}
                                </a>
                              ),
                            )}
                          </div>
                        )}
                    </div>

                    {isOwnMessage && !privateNote && (
                      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-indigo-100 text-indigo-700">
                        <UserRound size={17} />
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Empty state */}

              {visibleMessages.length === 0 && (
                <div className="rounded-xl border border-dashed border-slate-200 bg-white p-6 text-center">
                  <MessageSquare size={25} className="mx-auto text-slate-300" />

                  <p className="mt-3 text-sm font-medium text-slate-500">
                    No replies yet
                  </p>

                  <p className="mt-1 text-xs text-slate-400">
                    Send a message to continue the conversation.
                  </p>
                </div>
              )}
            </div>

            {/* Reply form */}

            <form
              onSubmit={sendReply}
              className="border-t border-slate-100 bg-white p-5 sm:p-6"
            >
              {isStaff && (
                <label className="mb-4 inline-flex cursor-pointer items-center gap-2 text-xs font-semibold text-slate-600">
                  <input
                    type="checkbox"
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    checked={internal}
                    onChange={(event) => setInternal(event.target.checked)}
                  />
                  Add as internal note (not emailed to customer)
                </label>
              )}

              {internal && (
                <div className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                  This message is for authorized support staff only.
                </div>
              )}

              <textarea
                className="input min-h-[120px] resize-y"
                placeholder={
                  internal
                    ? "Write an internal note for your team..."
                    : "Write your reply..."
                }
                value={body}
                onChange={(event) => setBody(event.target.value)}
                required
                maxLength={10000}
              />

              <div className="mt-3 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                <p className="text-xs text-slate-400">
                  {internal
                    ? "Internal notes stay within the support team."
                    : "Public replies may trigger an email notification."}
                </p>

                <button
                  type="submit"
                  disabled={sending || !body.trim()}
                  className="btn-primary"
                >
                  {sending
                    ? "Sending..."
                    : internal
                      ? "Add internal note"
                      : "Send reply"}

                  <Send size={15} />
                </button>
              </div>
            </form>
          </section>
        </div>

        {/* Ticket sidebar */}

        <aside className="space-y-5">
          <section className="panel p-5">
            <h2 className="section-title">Ticket details</h2>

            <div className="mt-5 space-y-4 text-sm">
              <Detail
                label="Requester"
                value={
                  ticket.requester?.fullName ||
                  ticket.requester?.name ||
                  ticket.requester?.email ||
                  "—"
                }
              />

              <Detail label="Category" value={ticket.category?.name || "—"} />

              <Detail
                label="Priority"
                value={<PriorityBadge priority={ticket.priority} />}
              />

              <Detail
                label="Assigned to"
                value={
                  ticket.assignedAgent?.fullName ||
                  ticket.assignedAgent?.name ||
                  "Unassigned"
                }
              />

              <Detail
                label="Last updated"
                value={new Date(
                  ticket.updatedAt || ticket.lastMessageAt || Date.now(),
                ).toLocaleString()}
              />
            </div>

            {/* Priority */}

            {isStaff && (
              <form
                onSubmit={updatePriority}
                className="mt-5 border-t border-slate-100 pt-4"
              >
                <label className="form-label">Change priority</label>

                <div className="flex gap-2">
                  <select
                    className="input"
                    value={newPriority}
                    onChange={(event) => setNewPriority(event.target.value)}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>

                  <button type="submit" className="btn-secondary">
                    Save
                  </button>
                </div>
              </form>
            )}

            {/* Attachments */}

            <div className="mt-5 border-t border-slate-100 pt-4">
              <h3 className="text-sm font-semibold">Attachments</h3>

              <label className="mt-3 flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-slate-300 p-3 text-xs text-indigo-600">
                <Paperclip size={14} />
                Upload file
                <input
                  type="file"
                  className="hidden"
                  onChange={uploadAttachment}
                />
              </label>

              <div className="mt-3 space-y-2">
                {attachments.map((attachment, index) => (
                  <button
                    type="button"
                    key={attachment._id || index}
                    onClick={() => downloadAttachment(attachment)}
                    className="block max-w-full truncate text-left text-xs text-indigo-600 hover:underline"
                  >
                    {attachment.originalName ||
                      attachment.filename ||
                      attachment.name ||
                      "Download attachment"}{" "}
                    · Download
                  </button>
                ))}

                {!attachments.length && (
                  <p className="text-xs text-slate-400">No attachments yet.</p>
                )}
              </div>
            </div>
          </section>

          {/* Admin assignment */}

          {isAdmin && (
            <section className="panel p-5">
              <h2 className="section-title">Assign to an agent</h2>

              <form onSubmit={assign} className="mt-4 space-y-3">
                <label className="block">
                  <span className="form-label">Support agent</span>

                  <select
                    className="input"
                    value={assignee}
                    onChange={(event) => setAssignee(event.target.value)}
                    required
                  >
                    <option value="">Choose an agent</option>

                    {agents.map((agent) => (
                      <option key={agent._id} value={agent._id}>
                        {agent.fullName || agent.name || agent.email}
                      </option>
                    ))}
                  </select>
                </label>

                {!agents.length && (
                  <p className="rounded-lg bg-amber-50 p-3 text-xs text-amber-800">
                    No active agents were returned.
                  </p>
                )}

                <button
                  type="submit"
                  disabled={!agents.length || !assignee}
                  className="btn-primary w-full"
                >
                  Assign ticket
                </button>
              </form>
            </section>
          )}

          {/* Activity timeline */}

          <section className="panel p-5">
            <h2 className="section-title">Activity timeline</h2>

            <div className="mt-5 space-y-4">
              {activity.length > 0 ? (
                activity.map((item, index) => (
                  <div key={item._id || index} className="flex gap-3">
                    <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-indigo-400 ring-4 ring-indigo-50" />

                    <div>
                      <p className="text-xs font-semibold text-slate-700">
                        {item.description || item.action || "Ticket updated"}
                      </p>

                      <p className="mt-1 text-[11px] text-slate-400">
                        {new Date(
                          item.createdAt || Date.now(),
                        ).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs leading-5 text-slate-400">
                  Activity will appear here when the backend records ticket
                  events.
                </p>
              )}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}

/* =========================================================
   REUSABLE DETAIL ROW
========================================================= */

function Detail({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="text-xs text-slate-400">{label}</span>

      <span className="max-w-[60%] text-right text-xs font-semibold text-slate-700">
        {value}
      </span>
    </div>
  );
}

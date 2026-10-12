import { useCallback, useEffect, useState } from "react";
import {
  Bell,
  CheckCheck,
  Clock3,
  Trash2,
  Check,
  RefreshCw,
  MessageSquare,
  Ticket,
  UserCheck,
  CircleCheck,
  AlertCircle,
} from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";

import client from "../api/client";
import endpoints from "../api/endpoints";
import LoadingScreen from "../components/ui/LoadingScreen";

/**
 * Your API response may contain its actual payload inside:
 *
 * response.data.message
 * response.data.data
 * response.data
 *
 * This helper handles all three without mistaking a status message
 * such as "Notifications fetched successfully" for the payload.
 */
function extractPayload(response) {
  const body = response?.data;

  if (!body) return null;

  const candidates = [
    body.message,
    body.data,
    body,
  ];

  for (const candidate of candidates) {
    if (
      candidate &&
      typeof candidate === "object" &&
      !Array.isArray(candidate)
    ) {
      return candidate;
    }
  }

  return null;
}

function extractNotifications(response) {
  const body = response?.data;

  const candidates = [
    body?.message?.notifications,
    body?.data?.notifications,
    body?.notifications,
    body?.message?.items,
    body?.data?.items,
    body?.items,
    body?.results,
    body?.message,
    body?.data,
  ];

  return candidates.find(Array.isArray) || [];
}

function extractUnreadCount(response, notifications = []) {
  const body = response?.data;

  const candidates = [
    body?.message?.unreadCount,
    body?.message?.count,
    body?.data?.unreadCount,
    body?.data?.count,
    body?.unreadCount,
    body?.count,
  ];

  for (const value of candidates) {
    if (value !== undefined && value !== null) {
      const count = Number(value);

      if (Number.isFinite(count)) {
        return count;
      }
    }
  }

  // Fallback: calculate from the currently loaded notifications.
  return notifications.filter((item) => !item.isRead).length;
}

function getNotificationIcon(type) {
  switch (type) {
    case "ticket_created":
      return Ticket;

    case "ticket_assigned":
      return UserCheck;

    case "ticket_reply":
    case "message_added":
      return MessageSquare;

    case "ticket_resolved":
    case "ticket_closed":
      return CircleCheck;

    case "ticket_reopened":
      return RefreshCw;

    default:
      return Bell;
  }
}

function getNotificationTime(notification) {
  const date = new Date(notification.createdAt);

  if (Number.isNaN(date.getTime())) {
    return "Date unavailable";
  }

  return date.toLocaleString();
}

function getTicketId(notification) {
  if (typeof notification.resourceId === "string") {
    return notification.resourceType === "ticket"
      ? notification.resourceId
      : null;
  }

  if (notification.ticket?._id) {
    return notification.ticket._id;
  }

  if (typeof notification.ticket === "string") {
    return notification.ticket;
  }

  if (notification.ticketId) {
    return notification.ticketId;
  }

  return null;
}

export default function Notifications() {
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadNotifications = useCallback(
    async ({ silent = false } = {}) => {
      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      try {
        const response = await client.get(endpoints.notifications);

        // Read the raw Axios response instead of relying on payload(),
        // whose extraction rules may not match your backend envelope.
        const notifications = extractNotifications(response);

        setItems(notifications);

        // Prefer the server count when available.
        try {
          const countResponse = await client.get(
            endpoints.notificationUnreadCount
          );

          setUnread(
            extractUnreadCount(countResponse, notifications)
          );
        } catch {
          // The notification list is still useful if the count endpoint
          // fails. Calculate the visible unread count as a fallback.
          setUnread(
            notifications.filter((notification) => !notification.isRead)
              .length
          );
        }
      } catch (err) {
        const message =
          err.response?.data?.message?.message ||
          (typeof err.response?.data?.message === "string"
            ? err.response.data.message
            : null) ||
          err.response?.data?.error ||
          err.message ||
          "Could not load notifications.";

        setError(message);

        toast.error(message);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  useEffect(() => {
    loadNotifications();

    // Refresh the notification list periodically so new activity appears
    // without requiring a page reload.
    const interval = window.setInterval(() => {
      loadNotifications({ silent: true });
    }, 15000);

    return () => window.clearInterval(interval);
  }, [loadNotifications]);

  async function markAsRead(notification) {
    if (notification.isRead) return;

    try {
      await client.patch(
        endpoints.notificationRead(notification._id),
        {}
      );

      setItems((previous) =>
        previous.map((item) =>
          item._id === notification._id
            ? {
                ...item,
                isRead: true,
                readAt: new Date().toISOString(),
              }
            : item
        )
      );

      setUnread((previous) => Math.max(0, previous - 1));

      toast.success("Notification marked as read");
    } catch (err) {
      toast.error(
        err.response?.data?.message?.message ||
          "Could not mark notification as read."
      );
    }
  }

  async function markAllAsRead() {
    if (unread === 0) return;

    try {
      await client.patch(endpoints.notificationReadAll, {});

      setItems((previous) =>
        previous.map((item) => ({
          ...item,
          isRead: true,
          readAt: item.readAt || new Date().toISOString(),
        }))
      );

      setUnread(0);

      toast.success("All notifications marked as read");
    } catch (err) {
      toast.error(
        err.response?.data?.message?.message ||
          "Could not mark all notifications as read."
      );
    }
  }

  async function deleteNotification(notification) {
    try {
      await client.delete(
        endpoints.notificationDelete(notification._id)
      );

      setItems((previous) =>
        previous.filter((item) => item._id !== notification._id)
      );

      if (!notification.isRead) {
        setUnread((previous) => Math.max(0, previous - 1));
      }

      toast.success("Notification deleted");
    } catch (err) {
      toast.error(
        err.response?.data?.message?.message ||
          "Could not delete notification."
      );
    }
  }

  if (loading) {
    return <LoadingScreen label="Loading notifications..." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">UPDATES</p>

          <h1 className="page-title">Notifications</h1>

          <p className="mt-2 text-sm text-slate-500">
            <span className="font-semibold text-indigo-600">
              {unread}
            </span>{" "}
            unread · Stay up to date with your support activity.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="btn-secondary"
            onClick={() => loadNotifications({ silent: true })}
            disabled={refreshing}
          >
            <RefreshCw
              size={16}
              className={refreshing ? "animate-spin" : ""}
            />
            Refresh
          </button>

          <button
            type="button"
            className="btn-secondary"
            onClick={markAllAsRead}
            disabled={unread === 0}
          >
            <CheckCheck size={16} />
            Mark all read
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          <AlertCircle size={18} className="mt-0.5 shrink-0" />

          <div className="min-w-0 flex-1">
            <p className="font-semibold">
              Unable to refresh notifications
            </p>

            <p className="mt-1">{error}</p>

            <button
              type="button"
              className="mt-2 font-semibold underline"
              onClick={() => loadNotifications()}
            >
              Try again
            </button>
          </div>
        </div>
      )}

      <section className="panel overflow-hidden">
        {items.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {items.map((notification) => {
              const Icon = getNotificationIcon(notification.type);
              const ticketId = getTicketId(notification);

              return (
                <article
                  key={notification._id}
                  className={`flex gap-3 p-4 transition-colors sm:gap-4 sm:p-5 ${
                    notification.isRead
                      ? "bg-white"
                      : "bg-indigo-50/60"
                  }`}
                >
                  <div
                    className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${
                      notification.isRead
                        ? "bg-slate-100 text-slate-500"
                        : "bg-indigo-100 text-indigo-600"
                    }`}
                  >
                    <Icon size={19} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-sm font-semibold text-slate-800">
                        {notification.title || "Notification"}
                      </h2>

                      {!notification.isRead && (
                        <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-semibold text-indigo-700">
                          NEW
                        </span>
                      )}
                    </div>

                    <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-6 text-slate-600">
                      {notification.message ||
                        notification.body ||
                        "You have a new support update."}
                    </p>

                    <p className="mt-2 text-xs text-slate-400">
                      <Clock3
                        size={12}
                        className="mr-1 inline"
                      />
                      {getNotificationTime(notification)}
                    </p>

                    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
                      {ticketId && (
                        <Link
                          className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                          to={`/tickets/${ticketId}`}
                        >
                          View ticket
                        </Link>
                      )}

                      {!notification.isRead && (
                        <button
                          type="button"
                          className="text-xs font-semibold text-emerald-700 hover:text-emerald-900"
                          onClick={() => markAsRead(notification)}
                        >
                          <Check
                            size={13}
                            className="mr-1 inline"
                          />
                          Mark as read
                        </button>
                      )}

                      <button
                        type="button"
                        className="text-xs font-semibold text-rose-600 hover:text-rose-800"
                        onClick={() =>
                          deleteNotification(notification)
                        }
                      >
                        <Trash2
                          size={13}
                          className="mr-1 inline"
                        />
                        Delete
                      </button>
                    </div>
                  </div>

                  {!notification.isRead && (
                    <span
                      aria-label="Unread"
                      className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-indigo-500"
                    />
                  )}
                </article>
              );
            })}
          </div>
        ) : (
          <div className="px-6 py-16 text-center">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-slate-100 text-slate-500">
              <CheckCheck size={24} />
            </div>

            <h2 className="mt-4 font-semibold text-slate-800">
              You're all caught up
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              New notifications will appear here when activity on your
              tickets generates them.
            </p>

            <button
              type="button"
              className="btn-secondary mt-5"
              onClick={() => loadNotifications({ silent: true })}
              disabled={refreshing}
            >
              <RefreshCw
                size={15}
                className={refreshing ? "animate-spin" : ""}
              />
              Check again
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
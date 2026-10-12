import { useCallback, useEffect, useState } from "react";

import {
  Activity,
  Bell,
  ChevronDown,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  Menu,
  Plus,
  Tags,
  Users,
  X,
  UserCircle,
  RefreshCw,
} from "lucide-react";

import { NavLink, Outlet, useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import client from "../api/client";
import endpoints from "../api/endpoints";

// Safely extract the unread notification count from the backend response.
function extractUnreadCount(response) {
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

      if (Number.isFinite(count) && count >= 0) {
        return count;
      }
    }
  }

  return null;
}

export default function AppShell() {
  const { user, logout, isStaff, isAdmin } = useAuth();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const navigate = useNavigate();

  /**
   * Fetch the unread notification count.
   */
  const loadUnreadCount = useCallback(async () => {
    try {
      const response = await client.get(
        endpoints.notificationUnreadCount,
      );

      const count = extractUnreadCount(response);

      if (count !== null) {
        setUnreadCount(count);
      }
    } catch (error) {
      console.error(
        "Failed to fetch unread notification count:",
        error.response?.data || error.message,
      );
    }
  }, []);

  /**
   * Fetch notifications initially and refresh periodically.
   */
  useEffect(() => {
    loadUnreadCount();

    const intervalId = window.setInterval(() => {
      loadUnreadCount();
    }, 15000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [loadUnreadCount]);

  /**
   * Main navigation.
   */
  const baseNav = [
    {
      to: "/dashboard",
      label: "Overview",
      icon: LayoutDashboard,
    },
    {
      to: "/tickets",
      label: isAdmin
        ? "All tickets"
        : isStaff
          ? "Support queue"
          : "My tickets",
      icon: ClipboardList,
    },
    {
      to: "/tickets/new",
      label: "Create ticket",
      icon: Plus,
    },
  ];

  const nav = [
    ...baseNav,
    {
      to: "/notifications",
      label: "Notifications",
      icon: Bell,
      badge: unreadCount,
    },
    {
      to: "/profile",
      label: "My profile",
      icon: UserCircle,
    },
  ];

  /**
   * Administrator-only navigation.
   *
   * Audit Logs and Email Events have been removed.
   */
  if (isAdmin) {
    nav.push(
      {
        to: "/categories",
        label: "Categories",
        icon: Tags,
      },
      {
        to: "/users",
        label: "Users",
        icon: Users,
      },
    );
  }

  /**
   * Sidebar.
   */
  const sidebar = (
    <aside className="flex h-full flex-col bg-slate-950 text-slate-300">
      {/* Brand */}
      <div className="flex h-[76px] items-center gap-3 border-b border-white/10 px-6">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-indigo-500 text-white">
          <Activity size={21} />
        </div>

        <div>
          <div className="font-bold tracking-tight text-white">
            SupportDesk
          </div>

          <div className="text-[11px] text-slate-400">
            Ticketing workspace
          </div>
        </div>

        <button
          type="button"
          className="ml-auto md:hidden"
          onClick={() => setMobileOpen(false)}
          aria-label="Close navigation"
        >
          <X size={20} />
        </button>
      </div>

      {/* Section label */}
      <div className="px-4 pt-6 text-[10px] font-bold uppercase tracking-[.18em] text-slate-500">
        Workspace
      </div>

      {/* Navigation */}
      <nav className="mt-3 flex-1 space-y-1 px-3">
        {nav.map(({ to, label, icon: Icon, badge }) => (
          <NavLink
            key={to}
            to={to}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              `sidebar-link ${
                isActive ? "sidebar-link-active" : ""
              }`
            }
          >
            <Icon size={18} strokeWidth={1.8} />

            <span className="min-w-0 flex-1">{label}</span>

            {/* Unread notification badge */}
            {label === "Notifications" && badge > 0 && (
              <span
                className="ml-auto inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-rose-500 px-1.5 text-[10px] font-bold leading-none text-white"
                aria-label={`${badge} unread notifications`}
              >
                {badge > 99 ? "99+" : badge}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Email support information */}
      <div className="m-3 rounded-xl border border-white/10 bg-white/5 p-3">
        <div className="text-xs font-semibold text-white">
          Email support enabled
        </div>

        <p className="mt-1 text-[11px] leading-5 text-slate-400">
          Replies sent from email are processed by the backend and
          appear in ticket conversations.
        </p>
      </div>

      {/* Footer */}
      <div className="border-t border-white/10 p-4 text-xs text-slate-500">
        SupportDesk · Workspace
      </div>
    </aside>
  );

  /**
   * Sign out safely.
   */
  async function handleLogout() {
    setMenuOpen(false);

    try {
      await logout();
    } finally {
      navigate("/login", { replace: true });
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Desktop sidebar */}
      <div className="fixed inset-y-0 left-0 z-40 hidden w-[252px] md:block">
        {sidebar}
      </div>

      {/* Mobile sidebar */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-slate-950/50"
            onClick={() => setMobileOpen(false)}
            aria-label="Close navigation overlay"
          />

          <div className="relative h-full w-[280px]">
            {sidebar}
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="md:pl-[252px]">
        {/* Header */}
        <header className="sticky top-0 z-30 flex h-[76px] items-center justify-between border-b border-slate-200 bg-white/90 px-4 backdrop-blur sm:px-7">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 md:hidden"
              onClick={() => setMobileOpen(true)}
              aria-label="Open navigation"
            >
              <Menu size={21} />
            </button>

            <div>
              <p className="text-sm font-semibold text-slate-800">
                Workspace
              </p>

              <p className="hidden text-xs text-slate-400 sm:block">
                Manage customer conversations with clarity
              </p>
            </div>
          </div>

          {/* User menu */}
          <div className="relative">
            <button
              type="button"
              onClick={() =>
                setMenuOpen((previous) => !previous)
              }
              className="flex items-center gap-3 rounded-xl p-1.5 hover:bg-slate-50"
              aria-expanded={menuOpen}
            >
              <div className="grid h-9 w-9 place-items-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-700">
                {(user?.fullName || user?.email || "U")
                  .slice(0, 1)
                  .toUpperCase()}
              </div>

              <div className="hidden text-left sm:block">
                <p className="max-w-[170px] truncate text-sm font-semibold text-slate-800">
                  {user?.fullName || user?.email || "User"}
                </p>

                <p className="text-[11px] capitalize text-slate-500">
                  {user?.role || "customer"}
                </p>
              </div>

              <ChevronDown
                size={15}
                className="text-slate-400"
              />
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-12 z-50 w-52 rounded-xl border border-slate-200 bg-white p-1.5 shadow-soft">
                {/* Profile */}
                <button
                  type="button"
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
                  onClick={() => {
                    setMenuOpen(false);
                    navigate("/profile");
                  }}
                >
                  <UserCircle size={16} />
                  My profile
                </button>

                {/* Notifications */}
                <button
                  type="button"
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
                  onClick={() => {
                    setMenuOpen(false);
                    navigate("/notifications");
                  }}
                >
                  <Bell size={16} />

                  <span className="flex-1 text-left">
                    Notifications
                  </span>

                  {unreadCount > 0 && (
                    <span className="rounded-full bg-rose-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  )}
                </button>

                {/* Refresh unread count */}
                <button
                  type="button"
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
                  onClick={() => {
                    loadUnreadCount();
                  }}
                >
                  <RefreshCw size={16} />
                  Refresh notifications
                </button>

                <div className="my-1 border-t border-slate-100" />

                {/* Logout */}
                <button
                  type="button"
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-rose-600 hover:bg-rose-50"
                  onClick={handleLogout}
                >
                  <LogOut size={16} />
                  Sign out
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Routed page */}
        <main className="mx-auto max-w-[1600px] p-4 sm:p-7 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
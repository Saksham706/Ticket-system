import { useCallback, useEffect, useState } from "react";
import client, { payload } from "../api/client";
import endpoints from "../api/endpoints";

export default function useNotificationCount() {
  const [unreadCount, setUnreadCount] = useState(0);

  const refreshUnreadCount = useCallback(async () => {
    try {
      const response = await client.get(endpoints.notificationUnreadCount);

      const data = payload(response);

      const count = Number(
        data?.unreadCount ?? data?.count ?? data?.data?.unreadCount ?? 0,
      );

      setUnreadCount(Number.isFinite(count) ? count : 0);
    } catch (error) {
      console.error(
        "Failed to load unread notification count:",
        error.response?.data || error.message,
      );
    }
  }, []);

  useEffect(() => {
    refreshUnreadCount();

    const interval = window.setInterval(refreshUnreadCount, 10000);

    window.addEventListener("focus", refreshUnreadCount);

    return () => {
      window.clearInterval(interval);

      window.removeEventListener("focus", refreshUnreadCount);
    };
  }, [refreshUnreadCount]);

  return {
    unreadCount,
    refreshUnreadCount,
    setUnreadCount,
  };
}

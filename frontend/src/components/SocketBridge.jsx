import { useEffect } from "react";
import { io } from "socket.io-client";
import { toast } from "react-toastify";
import { useAuth } from "../context/AuthContext";

export default function SocketBridge() {
  const { isAuthenticated } = useAuth();
  useEffect(() => {
    if (!isAuthenticated || import.meta.env.VITE_ENABLE_SOCKET === "false")
      return;
    const token = localStorage.getItem("accessToken");
    if (!token) return;
    const socket = io(
      import.meta.env.VITE_SOCKET_URL || "http://localhost:5000",
      {
        auth: { token },
        transports: ["websocket", "polling"],
        reconnection: true,
        reconnectionAttempts: 5,
      },
    );
    const refreshHint = () =>
      toast.info(
        "Ticket updates are available. Refresh the ticket to see the latest conversation.",
        { autoClose: 2500 },
      );
    // Backend event names may vary; support common names without assuming server implementation.
    [
      "ticket:updated",
      "ticket.updated",
      "ticket:message",
      "message:new",
      "notification:new",
    ].forEach((event) => socket.on(event, refreshHint));
    socket.on("connect_error", () => {
      /* realtime is optional; REST remains available */
    });
    return () => socket.disconnect();
  }, [isAuthenticated]);
  return null;
}

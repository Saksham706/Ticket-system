const { Server } = require("socket.io");
const { verifyAccessToken } = require("../utils/generateTokens");
const { User } = require("../modules/user/user.model");
const env = require("../config/env");
const logger = require("../utils/logger");

let io;

function initializeSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: [env.CLIENT_URL],
      credentials: true,
    },
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error("Authentication required"));

      // Use the same token verifier as REST auth. The old implementation
      // required issuer/audience claims that the token generator did not set.
      const payload = verifyAccessToken(token);
      const user = await User.findById(payload.sub).select("role isActive");
      if (!user || !user.isActive)
        return next(new Error("Account unavailable"));

      socket.data.user = { id: String(user._id), role: user.role };
      next();
    } catch {
      next(new Error("Invalid access token"));
    }
  });

  io.on("connection", (socket) => {
    socket.join(`user:${socket.data.user.id}`);
    logger.info("Socket connected", { userId: socket.data.user.id });
    socket.on("disconnect", (reason) => {
      logger.info("Socket disconnected", {
        userId: socket.data.user.id,
        reason,
      });
    });
  });

  return io;
}

function getIO() {
  if (!io) throw new Error("Socket.IO has not been initialized");
  return io;
}

function notifyUser(userId, event, payload) {
  if (io && userId) io.to(`user:${String(userId)}`).emit(event, payload);
}

function notifyTicketParticipants(ticket, event, payload) {
  if (!io || !ticket) return;
  const ids = [ticket.requester, ticket.assignedAgent]
    .filter(Boolean)
    .map((value) => String(value._id || value));
  for (const id of new Set(ids)) notifyUser(id, event, payload);
}

module.exports = {
  initializeSocket,
  getIO,
  notifyUser,
  notifyTicketParticipants,
};

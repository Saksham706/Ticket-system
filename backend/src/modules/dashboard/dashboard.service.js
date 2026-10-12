const mongoose = require("mongoose");

const { Ticket } = require("../ticket/ticket.model");

const { User } = require("../user/user.model");

const { TicketMessage } = require("../ticketMessage/ticketMessage.model");

const { Notification } = require("../notification/notification.model");

const ApiError = require("../../utils/ApiError");

const TICKET_STATUSES = [
  "open",
  "in_progress",
  "pending",
  "resolved",
  "closed",
];

function getUserId(user) {
  return String(user._id || user.id);
}

function getTicketFilter(user) {
  const userId = getUserId(user);

  if (user.role === "admin") {
    return {};
  }

  if (user.role === "agent") {
    return {
      $or: [{ assignedAgent: userId }, { requester: userId }],
    };
  }

  return {
    requester: userId,
  };
}

async function getStatusStatistics(filter) {
  const statistics = await Ticket.aggregate([
    {
      $match: filter,
    },
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
      },
    },
  ]);

  const result = {};

  for (const status of TICKET_STATUSES) {
    result[status] = 0;
  }

  for (const item of statistics) {
    result[item._id] = item.count;
  }

  return result;
}

async function getDashboard(user) {
  if (!user || !user.role) {
    throw new ApiError(401, "Authentication required");
  }

  const filter = getTicketFilter(user);

  const [
    totalTickets,
    statusStatistics,
    unreadNotifications,
    recentTickets,
    recentMessages,
  ] = await Promise.all([
    Ticket.countDocuments(filter),

    getStatusStatistics(filter),

    Notification.countDocuments({
      user: getUserId(user),
      isRead: false,
    }),

    Ticket.find(filter)
      .sort({ updatedAt: -1 })
      .limit(5)
      .select(
        "ticketNumber title status priority requester assignedTo createdAt updatedAt",
      )
      .populate("requester", "fullName email")
      .populate("assignedAgent", "fullName email"),

    TicketMessage.find({
      ticket: {
        $in: await Ticket.find(filter).distinct("_id"),
      },
      isInternal: false,
    })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("sender", "fullName role")
      .populate("ticket", "ticketNumber title"),
  ]);

  const result = {
    overview: {
      totalTickets,
      openTickets: statusStatistics.open,
      inProgressTickets: statusStatistics.in_progress,
      pendingTickets: statusStatistics.pending,
      resolvedTickets: statusStatistics.resolved,
      closedTickets: statusStatistics.closed,
      unreadNotifications,
    },

    ticketsByStatus: statusStatistics,

    recentTickets,

    recentMessages,
  };

  if (user.role === "admin") {
    const [totalUsers, totalAgents, totalCustomers] = await Promise.all([
      User.countDocuments({
        isActive: true,
      }),

      User.countDocuments({
        role: "agent",
        isActive: true,
      }),

      User.countDocuments({
        role: "customer",
        isActive: true,
      }),
    ]);

    result.overview.totalUsers = totalUsers;
    result.overview.totalAgents = totalAgents;
    result.overview.totalCustomers = totalCustomers;
  }

  if (user.role === "agent") {
    result.overview.assignedTickets = await Ticket.countDocuments({
      assignedAgent: getUserId(user),
    });
  }

  return result;
}

module.exports = {
  getDashboard,
  getTicketFilter,
  getStatusStatistics,
};

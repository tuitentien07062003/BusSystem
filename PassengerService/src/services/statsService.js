import { fn, col } from "sequelize";
import sequelize from "../config/database.js";
import { User, Ticket, TripFeedback } from "../models/index.js";

export async function getOverview() {
  const [
    totalUsers,
    totalTickets,
    totalRevenue,
    activeTickets,
    pendingFeedback,
  ] = await Promise.all([
    User.count(),
    Ticket.count({ where: { payment_status: "paid" } }),
    Ticket.sum("price", { where: { payment_status: "paid" } }),
    Ticket.count({
      where: {
        status: "active",
        payment_status: "paid",
      },
    }),
    TripFeedback.count({ where: { type: "general", status: "new" } }),
  ]);

  return {
    total_users: totalUsers,
    total_tickets_sold: totalTickets,
    total_revenue: Number(totalRevenue || 0),
    active_tickets: activeTickets,
    pending_feedback: pendingFeedback,
  };
}

export async function getRevenueTimeSeries(days = 30) {
  const rows = await sequelize.query(
    `
    SELECT 
      TO_CHAR(DATE(paid_at), 'YYYY-MM-DD') AS date,
      COUNT(*)::int AS tickets,
      COALESCE(SUM(price), 0)::int AS revenue
    FROM tickets
    WHERE payment_status = 'paid'
      AND paid_at IS NOT NULL
      AND paid_at >= NOW() - INTERVAL '${Number(days)} days'
    GROUP BY DATE(paid_at)
    ORDER BY date ASC
  `,
    { type: sequelize.QueryTypes.SELECT },
  );

  const map = new Map(rows.map((r) => [r.date, r]));
  const result = [];
  const today = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const ds = d.toISOString().slice(0, 10);
    const found = map.get(ds);
    result.push({
      date: ds,
      tickets: found?.tickets || 0,
      revenue: found?.revenue || 0,
    });
  }
  return result;
}

export async function getTicketBreakdown() {
  const [byType, byMethod, byStatus] = await Promise.all([
    Ticket.findAll({
      attributes: [
        "ticket_type",
        [fn("COUNT", col("id")), "count"],
        [fn("SUM", col("price")), "revenue"],
      ],
      where: { payment_status: "paid" },
      group: ["ticket_type"],
      raw: true,
    }),
    Ticket.findAll({
      attributes: ["payment_method", [fn("COUNT", col("id")), "count"]],
      where: { payment_status: "paid" },
      group: ["payment_method"],
      raw: true,
    }),
    Ticket.findAll({
      attributes: ["payment_status", [fn("COUNT", col("id")), "count"]],
      group: ["payment_status"],
      raw: true,
    }),
  ]);

  return {
    by_type: byType.map((r) => ({
      ticket_type: r.ticket_type,
      count: Number(r.count),
      revenue: Number(r.revenue || 0),
    })),
    by_method: byMethod.map((r) => ({
      payment_method: r.payment_method || "unknown",
      count: Number(r.count),
    })),
    by_status: byStatus.map((r) => ({
      status: r.payment_status,
      count: Number(r.count),
    })),
  };
}

export async function getFeedbackBreakdown() {
  const rows = await TripFeedback.findAll({
    attributes: ["status", [fn("COUNT", col("id")), "count"]],
    where: { type: "general" },
    group: ["status"],
    raw: true,
  });
  return rows.map((r) => ({
    status: r.status,
    count: Number(r.count),
  }));
}

export async function getRecentActivity(limit = 10) {
  const [recentTickets, recentFeedbacks] = await Promise.all([
    Ticket.findAll({
      where: { payment_status: "paid" },
      order: [["paid_at", "DESC"]],
      limit,
      attributes: [
        "id",
        "user_id",
        "ticket_type",
        "price",
        "payment_method",
        "paid_at",
      ],
      raw: true,
    }),
    TripFeedback.findAll({
      where: { type: "general" },
      order: [["created_at", "DESC"]],
      limit,
      attributes: ["id", "full_name", "comment", "status", "created_at"],
      raw: true,
    }),
  ]);

  return {
    recent_tickets: recentTickets,
    recent_feedbacks: recentFeedbacks,
  };
}

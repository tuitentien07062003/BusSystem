import * as statsService from "../services/statsService.js";

function handleError(res, err, context) {
  console.error(`[statsController.${context}]`, err);
  res.status(err.status || 500).json({
    error: err.message || "Lỗi server.",
  });
}

export async function overview(req, res) {
  try {
    const data = await statsService.getOverview();
    res.json(data);
  } catch (err) {
    handleError(res, err, "overview");
  }
}

export async function revenue(req, res) {
  try {
    const days = Math.min(Math.max(parseInt(req.query.days) || 30, 1), 365);
    const data = await statsService.getRevenueTimeSeries(days);
    res.json({ days, data });
  } catch (err) {
    handleError(res, err, "revenue");
  }
}

export async function tickets(req, res) {
  try {
    const data = await statsService.getTicketBreakdown();
    res.json(data);
  } catch (err) {
    handleError(res, err, "tickets");
  }
}

export async function feedbacks(req, res) {
  try {
    const data = await statsService.getFeedbackBreakdown();
    res.json({ data });
  } catch (err) {
    handleError(res, err, "feedbacks");
  }
}

export async function recent(req, res) {
  try {
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 10, 1), 50);
    const data = await statsService.getRecentActivity(limit);
    res.json(data);
  } catch (err) {
    handleError(res, err, "recent");
  }
}

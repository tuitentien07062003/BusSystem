import * as operationService from "../services/routeOperationService.js";
import * as statsService from "../services/routeStatsService.js";
import * as tripGenService from "../services/tripGenerationService.js";

// ═══════════════════════════════════════════════════════════════
// Helper: chuẩn hóa lỗi
// ═══════════════════════════════════════════════════════════════
function handleError(res, err, context = "") {
  console.error(
    `[routeOperationController${context ? `.${context}` : ""}]`,
    err,
  );
  res.status(err.status || 500).json({
    error: err.message || "Lỗi server.",
  });
}

// ═══════════════════════════════════════════════════════════════
// ACTIVATE — POST /routes/:id/activate
// Body: { description?, operating_start_time?, operating_end_time?,
//         base_fare?, min_headway_seconds?, max_headway_seconds? }
// ═══════════════════════════════════════════════════════════════
export async function activate(req, res) {
  try {
    const routeId = parseInt(req.params.id);
    const result = await operationService.activateRoute(routeId, req.body);
    res.status(201).json({
      message: "Đã kích hoạt tuyến.",
      data: result,
    });
  } catch (err) {
    handleError(res, err, "activate");
  }
}

// ═══════════════════════════════════════════════════════════════
// DEACTIVATE — DELETE /routes/:id/operations
// ═══════════════════════════════════════════════════════════════
export async function deactivate(req, res) {
  try {
    const routeId = parseInt(req.params.id);
    const result = await operationService.deactivateRoute(routeId);
    res.json({
      message: "Đã hủy kích hoạt tuyến.",
      data: result,
    });
  } catch (err) {
    handleError(res, err, "deactivate");
  }
}

// ═══════════════════════════════════════════════════════════════
// GET — GET /routes/:id/operations
// Trả về metadata vận hành + stats cache
// ═══════════════════════════════════════════════════════════════
export async function getOperations(req, res) {
  try {
    const routeId = parseInt(req.params.id);
    const result = await operationService.getRouteOperations(routeId);
    res.json(result);
  } catch (err) {
    handleError(res, err, "getOperations");
  }
}

// ═══════════════════════════════════════════════════════════════
// UPDATE — PUT /routes/:id/operations
// Body: { description?, operating_start_time?, ..., base_fare? }
// ═══════════════════════════════════════════════════════════════
export async function updateOperations(req, res) {
  try {
    const routeId = parseInt(req.params.id);
    const result = await operationService.updateRouteOperations(
      routeId,
      req.body,
    );
    res.json({
      message: "Đã cập nhật thông tin vận hành.",
      data: result,
    });
  } catch (err) {
    handleError(res, err, "updateOperations");
  }
}

// ═══════════════════════════════════════════════════════════════
// GET STATS BY DATE — GET /routes/:id/stats?date=YYYY-MM-DD
// Trả về số chuyến + giãn cách của 1 ngày
// ═══════════════════════════════════════════════════════════════
export async function getStatsByDate(req, res) {
  try {
    const routeId = parseInt(req.params.id);
    const date = req.query.date || new Date().toISOString().slice(0, 10);
    const result = await statsService.getRouteStatsForDate(routeId, date);
    res.json(result);
  } catch (err) {
    handleError(res, err, "getStatsByDate");
  }
}

// ═══════════════════════════════════════════════════════════════
// RECOMPUTE STATS — POST /routes/:id/recompute-stats
// Tính lại độ dài + travel time
// ═══════════════════════════════════════════════════════════════
export async function recomputeStats(req, res) {
  try {
    const routeId = parseInt(req.params.id);
    const result = await statsService.computeRouteStats(routeId);
    res.json({
      message: "Đã tính lại số liệu tuyến.",
      data: result,
    });
  } catch (err) {
    handleError(res, err, "recomputeStats");
  }
}

export async function previewTrips(req, res) {
  try {
    const routeId = parseInt(req.params.id);
    const result = await tripGenService.previewTrips(routeId, req.body);
    res.json(result);
  } catch (err) {
    handleError(res, err, "previewTrips");
  }
}

export async function generateTrips(req, res) {
  try {
    const routeId = parseInt(req.params.id);
    const result = await tripGenService.generateTrips(routeId, req.body);
    res.status(201).json({
      message: `Đã sinh ${result.inserted} chuyến.`,
      data: result,
    });
  } catch (err) {
    handleError(res, err, "generateTrips");
  }
}

export async function regenerateTrips(req, res) {
  try {
    const routeId = parseInt(req.params.id);
    const result = await tripGenService.regenerateTrips(routeId, req.body);
    res.status(201).json({
      message: `Đã sinh lại ${result.inserted} chuyến.`,
      data: result,
    });
  } catch (err) {
    handleError(res, err, "regenerateTrips");
  }
}

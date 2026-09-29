import * as headwayService from "../services/headwayConfigService.js";

function handleError(res, err, context = "") {
  console.error(
    `[headwayConfigController${context ? `.${context}` : ""}]`,
    err,
  );
  res.status(err.status || 500).json({
    error: err.message || "Lỗi server.",
    ...(err.validation ? { validation: err.validation } : {}),
  });
}

// ═══════════════════════════════════════════════════════════════
// GET /routes/:id/headway-configs
// Lấy configs hiện tại của tuyến
// ═══════════════════════════════════════════════════════════════
export async function getConfigs(req, res) {
  try {
    const routeId = parseInt(req.params.id);
    const configs = await headwayService.getConfigsByRoute(routeId);
    res.json({ route_id: routeId, configs });
  } catch (err) {
    handleError(res, err, "getConfigs");
  }
}

// ═══════════════════════════════════════════════════════════════
// PUT /routes/:id/headway-configs
// Body: { configs: [{ from_time, to_time, headway_seconds, label? }] }
// Bulk replace toàn bộ configs
// ═══════════════════════════════════════════════════════════════
export async function replaceConfigs(req, res) {
  try {
    const routeId = parseInt(req.params.id);
    const configs = req.body?.configs || [];

    const result = await headwayService.replaceConfigs(routeId, configs);
    res.json({
      message: "Đã lưu cấu hình khung giờ.",
      route_id: routeId,
      configs: result.configs,
      warnings: result.warnings,
    });
  } catch (err) {
    handleError(res, err, "replaceConfigs");
  }
}

// ═══════════════════════════════════════════════════════════════
// DELETE /routes/:id/headway-configs
// Xóa toàn bộ configs
// ═══════════════════════════════════════════════════════════════
export async function clearConfigs(req, res) {
  try {
    const routeId = parseInt(req.params.id);
    const result = await headwayService.clearConfigs(routeId);
    res.json({
      message: "Đã xóa cấu hình khung giờ.",
      route_id: routeId,
      ...result,
    });
  } catch (err) {
    handleError(res, err, "clearConfigs");
  }
}

// ═══════════════════════════════════════════════════════════════
// GET /routes/:id/headway-configs/preset?category=urban
// Trả về config mẫu (chưa lưu)
// ═══════════════════════════════════════════════════════════════
export async function getPreset(req, res) {
  try {
    const category = req.query.category || "urban";
    const configs = headwayService.getPresetConfigs(category);
    res.json({ category, configs });
  } catch (err) {
    handleError(res, err, "getPreset");
  }
}

// ═══════════════════════════════════════════════════════════════
// POST /routes/:id/headway-configs/validate
// Body: { configs: [...], operating_start_time?, operating_end_time? }
// Validate configs mà không lưu
// ═══════════════════════════════════════════════════════════════
export async function validateConfigs(req, res) {
  try {
    const configs = req.body?.configs || [];
    const { operating_start_time, operating_end_time } = req.body || {};

    const result = headwayService.validateConfigs(configs, {
      operatingStart: operating_start_time,
      operatingEnd: operating_end_time,
    });

    res.json(result);
  } catch (err) {
    handleError(res, err, "validateConfigs");
  }
}

import * as service from "../services/shiftTemplateService.js";

function handleError(res, err, context = "") {
  console.error(
    `[shiftTemplateController${context ? "." + context : ""}]`,
    err,
  );
  res.status(err.status || 500).json({
    error: err.message || "Lỗi server.",
    ...(err.validation ? { validation: err.validation } : {}),
  });
}

// ═══════════════════════════════════════════════════════════════
// GET /fleet/shift-templates
// Query: ?is_active=true
// ═══════════════════════════════════════════════════════════════
export async function list(req, res) {
  try {
    let is_active;
    if (req.query.is_active !== undefined) {
      is_active = req.query.is_active === "true";
    }
    const result = await service.getAllTemplates({ is_active });
    res.json(result);
  } catch (err) {
    handleError(res, err, "list");
  }
}

// ═══════════════════════════════════════════════════════════════
// GET /fleet/shift-templates/active
// Trả 2 template đang dùng + usage count
// ═══════════════════════════════════════════════════════════════
export async function listActive(req, res) {
  try {
    const result = await service.getActiveTemplates();
    res.json(result);
  } catch (err) {
    handleError(res, err, "listActive");
  }
}

// ═══════════════════════════════════════════════════════════════
// GET /fleet/shift-templates/:id
// ═══════════════════════════════════════════════════════════════
export async function getById(req, res) {
  try {
    const result = await service.getTemplateById(req.params.id);
    res.json(result);
  } catch (err) {
    handleError(res, err, "getById");
  }
}

// ═══════════════════════════════════════════════════════════════
// GET /fleet/shift-templates/:id/usage-stats
// ═══════════════════════════════════════════════════════════════
export async function usageStats(req, res) {
  try {
    const result = await service.getUsageStats(req.params.id);
    res.json(result);
  } catch (err) {
    handleError(res, err, "usageStats");
  }
}

// ═══════════════════════════════════════════════════════════════
// GET /fleet/shift-templates/:id/impact
// ═══════════════════════════════════════════════════════════════
export async function impact(req, res) {
  try {
    const result = await service.getTemplateImpact(req.params.id);
    res.json(result);
  } catch (err) {
    handleError(res, err, "impact");
  }
}

// ═══════════════════════════════════════════════════════════════
// POST /fleet/shift-templates/validate
// Body: giống create + optional exclude_id
// ═══════════════════════════════════════════════════════════════
export async function validate(req, res) {
  try {
    const excludeId = req.body?.exclude_id
      ? parseInt(req.body.exclude_id)
      : null;
    const result = await service.validateTemplateData(req.body, { excludeId });
    res.json(result);
  } catch (err) {
    handleError(res, err, "validate");
  }
}

// ═══════════════════════════════════════════════════════════════
// POST /fleet/shift-templates
// ═══════════════════════════════════════════════════════════════
export async function create(req, res) {
  try {
    const result = await service.createTemplate(req.body);
    res.status(201).json({
      message: "Đã tạo ca làm việc.",
      data: result.data,
      warnings: result.warnings,
    });
  } catch (err) {
    handleError(res, err, "create");
  }
}

// ═══════════════════════════════════════════════════════════════
// PUT /fleet/shift-templates/:id
// ═══════════════════════════════════════════════════════════════
export async function update(req, res) {
  try {
    const result = await service.updateTemplate(req.params.id, req.body);
    res.json({
      message: "Đã cập nhật ca làm việc.",
      data: result.data,
      warnings: result.warnings,
      impact: result.impact,
    });
  } catch (err) {
    handleError(res, err, "update");
  }
}

// ═══════════════════════════════════════════════════════════════
// PATCH /fleet/shift-templates/:id/status
// Body: { is_active: true | false }
// ═══════════════════════════════════════════════════════════════
export async function changeStatus(req, res) {
  try {
    const { is_active } = req.body;
    const result = await service.changeTemplateStatus(req.params.id, is_active);
    res.json({
      message: is_active ? "Đã kích hoạt ca." : "Đã tắt ca.",
      data: result,
    });
  } catch (err) {
    handleError(res, err, "changeStatus");
  }
}

import * as service from "../services/shiftSwapService.js";

function handleError(res, err, context = "") {
  console.error(`[shiftSwapController${context ? "." + context : ""}]`, err);
  res.status(err.status || 500).json({
    error: err.message || "Lỗi server.",
    ...(err.validation ? { validation: err.validation } : {}),
  });
}

// ═══════════════════════════════════════════════════════════════
// GET /fleet/swaps
// ═══════════════════════════════════════════════════════════════
export async function list(req, res) {
  try {
    const result = await service.getAll({
      from: req.query.from,
      to: req.query.to,
      original_employee_id: req.query.original_employee_id,
      substitute_employee_id: req.query.substitute_employee_id,
      status: req.query.status,
      page: req.query.page,
      limit: req.query.limit,
    });
    res.json(result);
  } catch (err) {
    handleError(res, err, "list");
  }
}

// ═══════════════════════════════════════════════════════════════
// GET /fleet/swaps/by-date?date=YYYY-MM-DD
// ═══════════════════════════════════════════════════════════════
export async function byDate(req, res) {
  try {
    const result = await service.getByDate(req.query.date);
    res.json(result);
  } catch (err) {
    handleError(res, err, "byDate");
  }
}

// ═══════════════════════════════════════════════════════════════
// GET /fleet/swaps/stats?from=X&to=Y
// ═══════════════════════════════════════════════════════════════
export async function stats(req, res) {
  try {
    const result = await service.getStats({
      from: req.query.from,
      to: req.query.to,
    });
    res.json(result);
  } catch (err) {
    handleError(res, err, "stats");
  }
}

// ═══════════════════════════════════════════════════════════════
// POST /fleet/swaps/suggest
// Body: { assignment_id }
// ═══════════════════════════════════════════════════════════════
export async function suggest(req, res) {
  try {
    const result = await service.suggestSubstitutes(req.body?.assignment_id);
    res.json(result);
  } catch (err) {
    handleError(res, err, "suggest");
  }
}

// ═══════════════════════════════════════════════════════════════
// GET /fleet/swaps/:id
// ═══════════════════════════════════════════════════════════════
export async function getById(req, res) {
  try {
    const result = await service.getById(req.params.id);
    res.json(result);
  } catch (err) {
    handleError(res, err, "getById");
  }
}

// ═══════════════════════════════════════════════════════════════
// POST /fleet/swaps
// Body: { assignment_id, substitute_employee_id, reason }
// ═══════════════════════════════════════════════════════════════
export async function create(req, res) {
  try {
    const result = await service.create(req.body);
    res.status(201).json({
      message: `Đã swap ${result.original_employee?.employee_code || ""} → ${result.substitute_employee?.employee_code || ""}.`,
      data: result,
    });
  } catch (err) {
    handleError(res, err, "create");
  }
}

// ═══════════════════════════════════════════════════════════════
// DELETE /fleet/swaps/:id
// Xóa record (KHÔNG undo swap)
// ═══════════════════════════════════════════════════════════════
export async function remove(req, res) {
  try {
    const result = await service.remove(req.params.id);
    res.json({
      message: "Đã xóa bản ghi swap.",
      ...result,
    });
  } catch (err) {
    handleError(res, err, "remove");
  }
}

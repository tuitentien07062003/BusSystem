import * as service from "../services/dutyAssignmentService.js";

function handleError(res, err, context = "") {
  console.error(
    `[dutyAssignmentController${context ? "." + context : ""}]`,
    err,
  );
  res.status(err.status || 500).json({
    error: err.message || "Lỗi server.",
    ...(err.validation ? { validation: err.validation } : {}),
    ...(err.errors ? { errors: err.errors } : {}),
  });
}

// ═══════════════════════════════════════════════════════════════
// GET /fleet/assignments
// ═══════════════════════════════════════════════════════════════
export async function list(req, res) {
  try {
    const result = await service.getAll({
      date: req.query.date,
      from: req.query.from,
      to: req.query.to,
      route_id: req.query.route_id,
      employee_id: req.query.employee_id,
      vehicle_id: req.query.vehicle_id,
      shift_template_id: req.query.shift_template_id,
      depot_id: req.query.depot_id,
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
// GET /fleet/assignments/by-date?date=YYYY-MM-DD&depot_id=X
// ═══════════════════════════════════════════════════════════════
export async function byDate(req, res) {
  try {
    const result = await service.getByDate(req.query.date, {
      depot_id: req.query.depot_id,
    });
    res.json(result);
  } catch (err) {
    handleError(res, err, "byDate");
  }
}

// ═══════════════════════════════════════════════════════════════
// GET /fleet/assignments/stats?date=X&from=Y&to=Z&depot_id=D
// ═══════════════════════════════════════════════════════════════
export async function stats(req, res) {
  try {
    const result = await service.getStats({
      date: req.query.date,
      from: req.query.from,
      to: req.query.to,
      depot_id: req.query.depot_id,
    });
    res.json(result);
  } catch (err) {
    handleError(res, err, "stats");
  }
}

// ═══════════════════════════════════════════════════════════════
// POST /fleet/assignments/suggest
// Body: { date, route_id, shift_template_id, depot_id, buffer_minutes? }
// ═══════════════════════════════════════════════════════════════
export async function suggest(req, res) {
  try {
    const result = await service.suggestBlocks(req.body);
    res.json(result);
  } catch (err) {
    handleError(res, err, "suggest");
  }
}

// ═══════════════════════════════════════════════════════════════
// GET /fleet/assignments/:id
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
// POST /fleet/assignments
// Body: { date, shift_template_id, employee_id, vehicle_id, ... }
// ═══════════════════════════════════════════════════════════════
export async function create(req, res) {
  try {
    const force = req.body?.force === true;
    const result = await service.create(req.body, { force });
    res.status(201).json({
      message: "Đã tạo phân công.",
      data: result,
    });
  } catch (err) {
    handleError(res, err, "create");
  }
}

// ═══════════════════════════════════════════════════════════════
// POST /fleet/assignments/bulk
// Body: { date, route_id, shift_template_id, depot_id, blocks: [...] }
// ═══════════════════════════════════════════════════════════════
export async function bulkCreate(req, res) {
  try {
    const result = await service.bulkCreate(req.body);
    res.status(201).json({
      message: `Đã tạo ${result.inserted} phân công.`,
      ...result,
    });
  } catch (err) {
    handleError(res, err, "bulkCreate");
  }
}

// ═══════════════════════════════════════════════════════════════
// PUT /fleet/assignments/:id
// ═══════════════════════════════════════════════════════════════
export async function update(req, res) {
  try {
    const force = req.body?.force === true;
    const result = await service.update(req.params.id, req.body, { force });
    res.json({
      message: "Đã cập nhật phân công.",
      data: result,
    });
  } catch (err) {
    handleError(res, err, "update");
  }
}

// ═══════════════════════════════════════════════════════════════
// PATCH /fleet/assignments/:id/status
// Body: { status: '...' }
// ═══════════════════════════════════════════════════════════════
export async function changeStatus(req, res) {
  try {
    const result = await service.changeStatus(req.params.id, req.body.status);
    res.json({
      message: `Đã đổi trạng thái thành "${req.body.status}".`,
      data: result,
    });
  } catch (err) {
    handleError(res, err, "changeStatus");
  }
}

// ═══════════════════════════════════════════════════════════════
// DELETE /fleet/assignments/:id
// ═══════════════════════════════════════════════════════════════
export async function remove(req, res) {
  try {
    const result = await service.remove(req.params.id);
    res.json({
      message: "Đã xóa phân công.",
      ...result,
    });
  } catch (err) {
    handleError(res, err, "remove");
  }
}

import * as rosterService from "../services/rosterService.js";

// ═══════════════════════════════════════════════════════════════
// Helper
// ═══════════════════════════════════════════════════════════════
function handleError(res, err, context = "") {
  console.error(`[rosterController${context ? "." + context : ""}]`, err);
  res.status(err.status || 500).json({
    error: err.message || "Lỗi server.",
    ...(err.validation ? { validation: err.validation } : {}),
  });
}

// ═══════════════════════════════════════════════════════════════
// GET /fleet/rosters
// Query: ?from=X&to=Y&employee_id=Z&shift_template_id=W&status=S&depot_id=D&page=1&limit=100
// ═══════════════════════════════════════════════════════════════
export async function list(req, res) {
  try {
    const result = await rosterService.getAllRosters({
      from: req.query.from,
      to: req.query.to,
      employee_id: req.query.employee_id,
      shift_template_id: req.query.shift_template_id,
      status: req.query.status,
      depot_id: req.query.depot_id,
      page: req.query.page,
      limit: req.query.limit,
    });
    res.json(result);
  } catch (err) {
    handleError(res, err, "list");
  }
}

// ═══════════════════════════════════════════════════════════════
// GET /fleet/rosters/calendar?month=YYYY-MM&depot_id=X
// ═══════════════════════════════════════════════════════════════
export async function calendar(req, res) {
  try {
    const result = await rosterService.getCalendar({
      month: req.query.month,
      depot_id: req.query.depot_id,
    });
    res.json(result);
  } catch (err) {
    handleError(res, err, "calendar");
  }
}

// ═══════════════════════════════════════════════════════════════
// GET /fleet/rosters/coverage?date=YYYY-MM-DD&depot_id=X
// ═══════════════════════════════════════════════════════════════
export async function coverage(req, res) {
  try {
    const result = await rosterService.getCoverage({
      date: req.query.date,
      depot_id: req.query.depot_id,
    });
    res.json(result);
  } catch (err) {
    handleError(res, err, "coverage");
  }
}

// ═══════════════════════════════════════════════════════════════
// GET /fleet/rosters/stats?month=YYYY-MM&depot_id=X
// ═══════════════════════════════════════════════════════════════
export async function stats(req, res) {
  try {
    const result = await rosterService.getStats({
      month: req.query.month,
      depot_id: req.query.depot_id,
    });
    res.json(result);
  } catch (err) {
    handleError(res, err, "stats");
  }
}

// ═══════════════════════════════════════════════════════════════
// GET /fleet/rosters/suggest-pattern?total_drivers=60
// ═══════════════════════════════════════════════════════════════
export async function suggestPattern(req, res) {
  try {
    const result = await rosterService.suggestPatternForDrivers({
      total_drivers: req.query.total_drivers,
    });
    res.json(result);
  } catch (err) {
    handleError(res, err, "suggestPattern");
  }
}

// ═══════════════════════════════════════════════════════════════
// GET /fleet/rosters/by-employee/:id?from=X&to=Y
// ═══════════════════════════════════════════════════════════════
export async function byEmployee(req, res) {
  try {
    const result = await rosterService.getRostersByEmployee(req.params.id, {
      from: req.query.from,
      to: req.query.to,
    });
    res.json(result);
  } catch (err) {
    handleError(res, err, "byEmployee");
  }
}

// ═══════════════════════════════════════════════════════════════
// GET /fleet/rosters/:id
// ═══════════════════════════════════════════════════════════════
export async function getById(req, res) {
  try {
    const result = await rosterService.getRosterById(req.params.id);
    res.json(result);
  } catch (err) {
    handleError(res, err, "getById");
  }
}

// ═══════════════════════════════════════════════════════════════
// POST /fleet/rosters/preview
// Body: { from_month, months_count, groups: [{ name, employee_ids }] }
// ═══════════════════════════════════════════════════════════════
export async function previewBulk(req, res) {
  try {
    const result = await rosterService.previewBulkRoster(req.body);
    res.json(result);
  } catch (err) {
    handleError(res, err, "previewBulk");
  }
}

// ═══════════════════════════════════════════════════════════════
// POST /fleet/rosters/bulk
// Body: { from_month, months_count, groups, overwrite? }
// ═══════════════════════════════════════════════════════════════
export async function bulkCreate(req, res) {
  try {
    const overwrite = req.body?.overwrite === true;
    const result = await rosterService.bulkCreateRoster(req.body, {
      overwrite,
    });
    res.status(201).json({
      message: `Đã tạo ${result.inserted} Roster.`,
      ...result,
    });
  } catch (err) {
    handleError(res, err, "bulkCreate");
  }
}

// ═══════════════════════════════════════════════════════════════
// POST /fleet/rosters
// Body: { employee_id, date, shift_template_id, depot_id?, status?, force? }
// ═══════════════════════════════════════════════════════════════
export async function create(req, res) {
  try {
    const force = req.body?.force === true;
    const result = await rosterService.createRoster(req.body, { force });
    res.status(201).json({
      message: "Đã tạo Roster.",
      data: result,
    });
  } catch (err) {
    handleError(res, err, "create");
  }
}

// ═══════════════════════════════════════════════════════════════
// PUT /fleet/rosters/:id
// Body: giống create + force?
// ═══════════════════════════════════════════════════════════════
export async function update(req, res) {
  try {
    const force = req.body?.force === true;
    const result = await rosterService.updateRoster(req.params.id, req.body, {
      force,
    });
    res.json({
      message: "Đã cập nhật Roster.",
      data: result,
    });
  } catch (err) {
    handleError(res, err, "update");
  }
}

// ═══════════════════════════════════════════════════════════════
// PATCH /fleet/rosters/:id/status
// Body: { status: 'scheduled' | 'working' | 'completed' | 'swapped' | 'absent' | 'off' }
// ═══════════════════════════════════════════════════════════════
export async function changeStatus(req, res) {
  try {
    const result = await rosterService.changeRosterStatus(
      req.params.id,
      req.body.status,
    );
    res.json({
      message: `Đã đổi trạng thái thành "${req.body.status}".`,
      data: result,
    });
  } catch (err) {
    handleError(res, err, "changeStatus");
  }
}

// ═══════════════════════════════════════════════════════════════
// DELETE /fleet/rosters/:id
// ═══════════════════════════════════════════════════════════════
export async function remove(req, res) {
  try {
    const result = await rosterService.deleteRoster(req.params.id);
    res.json({
      message: "Đã xóa Roster.",
      ...result,
    });
  } catch (err) {
    handleError(res, err, "remove");
  }
}

import * as service from "../services/incidentService.js";

function handleError(res, err, context = "") {
  console.error(`[incidentController${context ? "." + context : ""}]`, err);
  res.status(err.status || 500).json({
    error: err.message || "Lỗi server.",
    ...(err.validation ? { validation: err.validation } : {}),
  });
}

// ═══════════════════════════════════════════════════════════════
// GET /fleet/incidents
// ═══════════════════════════════════════════════════════════════
export async function list(req, res) {
  try {
    const result = await service.getAll({
      status: req.query.status,
      type: req.query.type,
      severity: req.query.severity,
      route_id: req.query.route_id,
      vehicle_id: req.query.vehicle_id,
      driver_id: req.query.driver_id,
      trip_id: req.query.trip_id,
      from: req.query.from,
      to: req.query.to,
      page: req.query.page,
      limit: req.query.limit,
    });
    res.json(result);
  } catch (err) {
    handleError(res, err, "list");
  }
}

// ═══════════════════════════════════════════════════════════════
// GET /fleet/incidents/active?route_id=X
// ═══════════════════════════════════════════════════════════════
export async function active(req, res) {
  try {
    const result = await service.getActive({ route_id: req.query.route_id });
    res.json(result);
  } catch (err) {
    handleError(res, err, "active");
  }
}

// ═══════════════════════════════════════════════════════════════
// GET /fleet/incidents/by-date?date=YYYY-MM-DD
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
// GET /fleet/incidents/stats
// ═══════════════════════════════════════════════════════════════
export async function stats(req, res) {
  try {
    const result = await service.getStats({
      from: req.query.from,
      to: req.query.to,
      route_id: req.query.route_id,
      depot_id: req.query.depot_id,
    });
    res.json(result);
  } catch (err) {
    handleError(res, err, "stats");
  }
}

// ═══════════════════════════════════════════════════════════════
// GET /fleet/incidents/:id
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
// POST /fleet/incidents — driver báo sự cố
// ═══════════════════════════════════════════════════════════════
export async function create(req, res) {
  try {
    const result = await service.create(req.body);
    res.status(201).json({
      message: `Đã ghi nhận sự cố ${result.incident_code}.`,
      data: result,
    });
  } catch (err) {
    handleError(res, err, "create");
  }
}

// ═══════════════════════════════════════════════════════════════
// POST /fleet/incidents/:id/ack — admin tiếp nhận
// ═══════════════════════════════════════════════════════════════
export async function acknowledge(req, res) {
  try {
    const result = await service.acknowledge(req.params.id, {
      acknowledged_by: req.body?.acknowledged_by ?? 1,
    });
    res.json({
      message: "Đã tiếp nhận sự cố.",
      data: result,
    });
  } catch (err) {
    handleError(res, err, "acknowledge");
  }
}

// ═══════════════════════════════════════════════════════════════
// POST /fleet/incidents/:id/actions — log hành động
// ═══════════════════════════════════════════════════════════════
export async function addAction(req, res) {
  try {
    const result = await service.addAction(req.params.id, req.body);
    res.status(201).json({
      message: "Đã thêm hành động xử lý.",
      data: result,
    });
  } catch (err) {
    handleError(res, err, "addAction");
  }
}

// ═══════════════════════════════════════════════════════════════
// POST /fleet/incidents/:id/resolve — admin xử lý xong
// ═══════════════════════════════════════════════════════════════
export async function resolve(req, res) {
  try {
    const result = await service.resolve(req.params.id, req.body);
    res.json({
      message: "Đã xử lý sự cố.",
      data: result,
    });
  } catch (err) {
    handleError(res, err, "resolve");
  }
}

// ═══════════════════════════════════════════════════════════════
// POST /fleet/incidents/:id/close
// ═══════════════════════════════════════════════════════════════
export async function close(req, res) {
  try {
    const result = await service.close(req.params.id);
    res.json({
      message: "Đã đóng sự cố.",
      data: result,
    });
  } catch (err) {
    handleError(res, err, "close");
  }
}

// ═══════════════════════════════════════════════════════════════
// PUT /fleet/incidents/:id
// ═══════════════════════════════════════════════════════════════
export async function update(req, res) {
  try {
    const result = await service.update(req.params.id, req.body);
    res.json({
      message: "Đã cập nhật sự cố.",
      data: result,
    });
  } catch (err) {
    handleError(res, err, "update");
  }
}

// ═══════════════════════════════════════════════════════════════
// DELETE /fleet/incidents/:id
// ═══════════════════════════════════════════════════════════════
export async function remove(req, res) {
  try {
    const result = await service.remove(req.params.id);
    res.json({
      message: "Đã xóa sự cố.",
      ...result,
    });
  } catch (err) {
    handleError(res, err, "remove");
  }
}

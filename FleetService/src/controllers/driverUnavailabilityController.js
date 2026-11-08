import * as service from "../services/driverUnavailabilityService.js";

function handleError(res, err, context = "") {
  console.error(
    `[driverUnavailabilityController${context ? "." + context : ""}]`,
    err,
  );
  res.status(err.status || 500).json({
    error: err.message || "Lỗi server.",
    ...(err.validation ? { validation: err.validation } : {}),
  });
}

// ═══════════════════════════════════════════════════════════════
// GET /fleet/unavailability
// ═══════════════════════════════════════════════════════════════
export async function list(req, res) {
  try {
    const result = await service.getAll({
      driver_id: req.query.driver_id,
      from: req.query.from,
      to: req.query.to,
      type: req.query.type,
      page: req.query.page,
      limit: req.query.limit,
    });
    res.json(result);
  } catch (err) {
    handleError(res, err, "list");
  }
}

// ═══════════════════════════════════════════════════════════════
// GET /fleet/unavailability/check?driver_id=X&date=Y
// ═══════════════════════════════════════════════════════════════
export async function check(req, res) {
  try {
    const result = await service.checkDriverAvailability(
      req.query.driver_id,
      req.query.date,
    );
    res.json(result);
  } catch (err) {
    handleError(res, err, "check");
  }
}

// ═══════════════════════════════════════════════════════════════
// GET /fleet/unavailability/check-range?driver_id=X&from=Y&to=Z
// ═══════════════════════════════════════════════════════════════
export async function checkRange(req, res) {
  try {
    const result = await service.checkDriverRange(
      req.query.driver_id,
      req.query.from,
      req.query.to,
    );
    res.json(result);
  } catch (err) {
    handleError(res, err, "checkRange");
  }
}

// ═══════════════════════════════════════════════════════════════
// GET /fleet/unavailability/impact?driver_id=X&from=Y&to=Z
// ═══════════════════════════════════════════════════════════════
export async function impact(req, res) {
  try {
    const result = await service.getImpact({
      driver_id: req.query.driver_id,
      from: req.query.from,
      to: req.query.to,
    });
    res.json(result);
  } catch (err) {
    handleError(res, err, "impact");
  }
}

// ═══════════════════════════════════════════════════════════════
// GET /fleet/unavailability/stats?from=X&to=Y&type=Z
// ═══════════════════════════════════════════════════════════════
export async function stats(req, res) {
  try {
    const result = await service.getStats({
      from: req.query.from,
      to: req.query.to,
      type: req.query.type,
    });
    res.json(result);
  } catch (err) {
    handleError(res, err, "stats");
  }
}

// ═══════════════════════════════════════════════════════════════
// GET /fleet/unavailability/calendar?month=X&driver_id=Y
// ═══════════════════════════════════════════════════════════════
export async function calendar(req, res) {
  try {
    const result = await service.getCalendar({
      month: req.query.month,
      driver_id: req.query.driver_id,
    });
    res.json(result);
  } catch (err) {
    handleError(res, err, "calendar");
  }
}

// ═══════════════════════════════════════════════════════════════
// GET /fleet/unavailability/:id
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
// POST /fleet/unavailability
// Body: { driver_id, date_from, date_to, type, reason? }
// ═══════════════════════════════════════════════════════════════
export async function create(req, res) {
  try {
    const result = await service.create(req.body);
    res.status(201).json({
      message: "Đã ghi nhận nghỉ.",
      data: result.data,
      warnings: result.warnings,
      impact: result.impact,
    });
  } catch (err) {
    handleError(res, err, "create");
  }
}

// ═══════════════════════════════════════════════════════════════
// PUT /fleet/unavailability/:id
// ═══════════════════════════════════════════════════════════════
export async function update(req, res) {
  try {
    const result = await service.update(req.params.id, req.body);
    res.json({
      message: "Đã cập nhật ghi nhận nghỉ.",
      data: result.data,
      warnings: result.warnings,
      impact: result.impact,
    });
  } catch (err) {
    handleError(res, err, "update");
  }
}

// ═══════════════════════════════════════════════════════════════
// DELETE /fleet/unavailability/:id
// ═══════════════════════════════════════════════════════════════
export async function remove(req, res) {
  try {
    const result = await service.remove(req.params.id);
    res.json({
      message: "Đã xóa ghi nhận nghỉ.",
      ...result,
    });
  } catch (err) {
    handleError(res, err, "remove");
  }
}

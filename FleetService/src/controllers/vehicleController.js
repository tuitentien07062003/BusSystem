import * as vehicleService from "../services/vehicleService.js";

function handleError(res, err, context = "") {
  console.error(`[vehicleController${context ? "." + context : ""}]`, err);
  res.status(err.status || 500).json({
    error: err.message || "Lỗi server.",
  });
}

// ═══════════════════════════════════════════════════════════════
// GET /fleet/vehicles
// Query: ?page=1&limit=20&depot_id=1&vehicle_type_id=2&is_active=true&q=XE
// ═══════════════════════════════════════════════════════════════
export async function list(req, res) {
  try {
    let is_active;
    if (req.query.is_active !== undefined) {
      is_active = req.query.is_active === "true";
    }

    const result = await vehicleService.getAllVehicles({
      page: req.query.page,
      limit: req.query.limit,
      depot_id: req.query.depot_id,
      vehicle_type_id: req.query.vehicle_type_id,
      is_active,
      keyword: req.query.q || "",
    });

    res.json(result);
  } catch (err) {
    handleError(res, err, "list");
  }
}

// ═══════════════════════════════════════════════════════════════
// GET /fleet/vehicles/stats
// ═══════════════════════════════════════════════════════════════
export async function stats(req, res) {
  try {
    const result = await vehicleService.getVehicleStats();
    res.json(result);
  } catch (err) {
    handleError(res, err, "stats");
  }
}

// ═══════════════════════════════════════════════════════════════
// GET /fleet/vehicles/types
// Danh sách loại xe — dùng cho dropdown
// ═══════════════════════════════════════════════════════════════
export async function listTypes(req, res) {
  try {
    const data = await vehicleService.getAllVehicleTypes();
    res.json({ data });
  } catch (err) {
    handleError(res, err, "listTypes");
  }
}

// ═══════════════════════════════════════════════════════════════
// GET /fleet/vehicles/:id
// ═══════════════════════════════════════════════════════════════
export async function getById(req, res) {
  try {
    const result = await vehicleService.getVehicleById(req.params.id);
    res.json(result);
  } catch (err) {
    handleError(res, err, "getById");
  }
}

// ═══════════════════════════════════════════════════════════════
// POST /fleet/vehicles
// Body: { vehicle_code, license_plate, vehicle_type_id, depot_id, ... }
// ═══════════════════════════════════════════════════════════════
export async function create(req, res) {
  try {
    const created = await vehicleService.createVehicle(req.body);
    res.status(201).json({
      message: "Đã tạo xe.",
      data: created,
    });
  } catch (err) {
    handleError(res, err, "create");
  }
}

// ═══════════════════════════════════════════════════════════════
// PUT /fleet/vehicles/:id
// ═══════════════════════════════════════════════════════════════
export async function update(req, res) {
  try {
    const updated = await vehicleService.updateVehicle(req.params.id, req.body);
    res.json({
      message: "Đã cập nhật xe.",
      data: updated,
    });
  } catch (err) {
    handleError(res, err, "update");
  }
}

// ═══════════════════════════════════════════════════════════════
// PATCH /fleet/vehicles/:id/status
// Body: { is_active: true | false }
// ═══════════════════════════════════════════════════════════════
export async function changeStatus(req, res) {
  try {
    const { is_active } = req.body;
    const updated = await vehicleService.changeVehicleStatus(
      req.params.id,
      is_active,
    );
    res.json({
      message: "Đã đổi trạng thái xe.",
      data: updated,
    });
  } catch (err) {
    handleError(res, err, "changeStatus");
  }
}

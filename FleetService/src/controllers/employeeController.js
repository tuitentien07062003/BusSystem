import * as employeeService from "../services/employeeService.js";

// ═══════════════════════════════════════════════════════════════
// Helper: chuẩn hóa lỗi
// ═══════════════════════════════════════════════════════════════
function handleError(res, err, context = "") {
  console.error(`[employeeController${context ? "." + context : ""}]`, err);
  res.status(err.status || 500).json({
    error: err.message || "Lỗi server.",
  });
}

// ═══════════════════════════════════════════════════════════════
// GET /fleet/employees
// Query: ?page=1&limit=20&type=driver&is_active=true&q=nguyen
// ═══════════════════════════════════════════════════════════════
export async function list(req, res) {
  try {
    let is_active;
    if (req.query.is_active !== undefined) {
      is_active = req.query.is_active === "true";
    }

    const result = await employeeService.getAllEmployees({
      page: req.query.page,
      limit: req.query.limit,
      type: req.query.type,
      is_active,
      keyword: req.query.q || "",
    });

    res.json(result);
  } catch (err) {
    handleError(res, err, "list");
  }
}

// ═══════════════════════════════════════════════════════════════
// GET /fleet/employees/stats
// ═══════════════════════════════════════════════════════════════
export async function stats(req, res) {
  try {
    const result = await employeeService.getEmployeeStats();
    res.json(result);
  } catch (err) {
    handleError(res, err, "stats");
  }
}

// ═══════════════════════════════════════════════════════════════
// GET /fleet/employees/:id
// ═══════════════════════════════════════════════════════════════
export async function getById(req, res) {
  try {
    const result = await employeeService.getEmployeeById(req.params.id);
    res.json(result);
  } catch (err) {
    handleError(res, err, "getById");
  }
}

// ═══════════════════════════════════════════════════════════════
// POST /fleet/employees
// Body: { employee_code, full_name, type, phone?, email?, ... }
// ═══════════════════════════════════════════════════════════════
export async function create(req, res) {
  try {
    const created = await employeeService.createEmployee(req.body);
    res.status(201).json({
      message: "Đã tạo nhân viên.",
      data: created,
    });
  } catch (err) {
    handleError(res, err, "create");
  }
}

// ═══════════════════════════════════════════════════════════════
// PUT /fleet/employees/:id
// ═══════════════════════════════════════════════════════════════
export async function update(req, res) {
  try {
    const updated = await employeeService.updateEmployee(
      req.params.id,
      req.body,
    );
    res.json({
      message: "Đã cập nhật nhân viên.",
      data: updated,
    });
  } catch (err) {
    handleError(res, err, "update");
  }
}

// ═══════════════════════════════════════════════════════════════
// PATCH /fleet/employees/:id/status
// Body: { is_active: true | false }
// ═══════════════════════════════════════════════════════════════
export async function changeStatus(req, res) {
  try {
    const { is_active } = req.body;
    const updated = await employeeService.changeEmployeeStatus(
      req.params.id,
      is_active,
    );
    res.json({
      message: "Đã đổi trạng thái.",
      data: updated,
    });
  } catch (err) {
    handleError(res, err, "changeStatus");
  }
}

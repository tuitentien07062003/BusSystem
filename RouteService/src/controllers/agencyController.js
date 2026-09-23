// src/controllers/agencyController.js
// Xử lý HTTP request/response cho Agencies API
import * as agencyService from "../services/agencyService.js";

// ─────────────────────────────────────────────────────────
// GET /tbus/agencies?page=1&limit=20&is_active=true&q=...
// ─────────────────────────────────────────────────────────
export async function getAgencies(req, res) {
  try {
    const page = req.query.page;
    const limit = req.query.limit;
    const keyword = req.query.q || req.query.keyword || "";

    let is_active;
    if (req.query.is_active !== undefined) {
      is_active = req.query.is_active === "true";
    }

    const result = await agencyService.getAllAgencies({
      page,
      limit,
      is_active,
      keyword,
    });
    res.json(result);
  } catch (err) {
    console.error("[agencyController.getAgencies]", err);
    res.status(err.status || 500).json({ error: err.message || "Lỗi server." });
  }
}

// ─────────────────────────────────────────────────────────
// GET /tbus/agencies/stats
// ─────────────────────────────────────────────────────────
export async function getStats(req, res) {
  try {
    const stats = await agencyService.getAgencyStats();
    res.json(stats);
  } catch (err) {
    console.error("[agencyController.getStats]", err);
    res.status(err.status || 500).json({ error: err.message || "Lỗi server." });
  }
}

// ─────────────────────────────────────────────────────────
// GET /tbus/agencies/:id
// ─────────────────────────────────────────────────────────
export async function getAgencyById(req, res) {
  try {
    const agency = await agencyService.getAgencyById(req.params.id);
    res.json(agency);
  } catch (err) {
    console.error("[agencyController.getAgencyById]", err);
    res.status(err.status || 500).json({ error: err.message || "Lỗi server." });
  }
}

// ─────────────────────────────────────────────────────────
// POST /tbus/agencies
// Body: { agency_id, agency_name, agency_url?, agency_timezone?, is_active? }
// ─────────────────────────────────────────────────────────
export async function createAgency(req, res) {
  try {
    const created = await agencyService.createAgency(req.body);
    res.status(201).json({ message: "Tạo agency thành công.", data: created });
  } catch (err) {
    console.error("[agencyController.createAgency]", err);
    res.status(err.status || 500).json({ error: err.message || "Lỗi server." });
  }
}

// ─────────────────────────────────────────────────────────
// PUT /tbus/agencies/:id
// ─────────────────────────────────────────────────────────
export async function updateAgency(req, res) {
  try {
    const updated = await agencyService.updateAgency(req.params.id, req.body);
    res.json({ message: "Cập nhật thành công.", data: updated });
  } catch (err) {
    console.error("[agencyController.updateAgency]", err);
    res.status(err.status || 500).json({ error: err.message || "Lỗi server." });
  }
}

// ─────────────────────────────────────────────────────────
// PATCH /tbus/agencies/:id/status
// Body: { is_active: true | false }
// ─────────────────────────────────────────────────────────
export async function changeStatus(req, res) {
  try {
    const { is_active } = req.body;
    const updated = await agencyService.changeAgencyStatus(
      req.params.id,
      is_active
    );
    res.json({ message: "Đổi trạng thái thành công.", data: updated });
  } catch (err) {
    console.error("[agencyController.changeStatus]", err);
    res.status(err.status || 500).json({ error: err.message || "Lỗi server." });
  }
}

// src/controllers/stopController.js
// Xử lý HTTP request/response cho Stops API
import * as stopService from "../services/stopService.js";

// ─────────────────────────────────────────────────────────
// GET /api/stops?page=1&limit=20&is_active=true
// ─────────────────────────────────────────────────────────
export async function getStops(req, res) {
  try {
    const page = req.query.page;
    const limit = req.query.limit;

    let is_active;
    let stop_type;
    if (req.query.is_active !== undefined) {
      is_active = req.query.is_active === "true";
    }
    if (req.query.stop_type !== undefined) {
      stop_type = parseInt(req.query.stop_type);
    }

    const result = await stopService.getAllStops({ page, limit, is_active, stop_type });
    res.json(result);
  } catch (err) {
    console.error("[stopController.getStops]", err);
    res.status(err.status || 500).json({ error: err.message || "Lỗi server." });
  }
}

// ─────────────────────────────────────────────────────────
// GET /api/stops/search?q=Ben&page=1&limit=20
// ─────────────────────────────────────────────────────────
export async function searchStops(req, res) {
  try {
    const keyword = req.query.q || req.query.name || "";
    const page = req.query.page;
    const limit = req.query.limit;

    let is_active;
    let stop_type;
    if (req.query.is_active !== undefined) {
      is_active = req.query.is_active === "true";
    }
    if (req.query.stop_type !== undefined) {
      stop_type = parseInt(req.query.stop_type);
    }

    const result = await stopService.searchStopsByName(keyword, {
      page,
      limit,
      is_active,
      stop_type
    });
    res.json(result);
  } catch (err) {
    console.error("[stopController.searchStops]", err);
    res.status(err.status || 500).json({ error: err.message || "Lỗi server." });
  }
}

// ─────────────────────────────────────────────────────────
// GET /api/stops/stats
// ─────────────────────────────────────────────────────────
export async function getStats(req, res) {
  try {
    const stats = await stopService.getStopStats();
    res.json(stats);
  } catch (err) {
    console.error("[stopController.getStats]", err);
    res.status(err.status || 500).json({ error: err.message || "Lỗi server." });
  }
}

// ─────────────────────────────────────────────────────────
// GET /api/stops/:id
// ─────────────────────────────────────────────────────────
export async function getStopById(req, res) {
  try {
    const stop = await stopService.getStopById(req.params.id);
    res.json(stop);
  } catch (err) {
    console.error("[stopController.getStopById]", err);
    res.status(err.status || 500).json({ error: err.message || "Lỗi server." });
  }
}

// ─────────────────────────────────────────────────────────
// PUT /api/stops/:id
// Body: { stop_id?, stop_name?, stop_type?, is_active?, latitude?, longitude? }
// ─────────────────────────────────────────────────────────
export async function updateStop(req, res) {
  try {
    const updated = await stopService.updateStop(req.params.id, req.body);
    res.json({ message: "Cập nhật thành công.", data: updated });
  } catch (err) {
    console.error("[stopController.updateStop]", err);
    res.status(err.status || 500).json({ error: err.message || "Lỗi server." });
  }
}

// ─────────────────────────────────────────────────────────
// PATCH /api/stops/:id/status
// Body: { is_active: true | false }
// ─────────────────────────────────────────────────────────
export async function changeStatus(req, res) {
  try {
    const { is_active } = req.body;
    const updated = await stopService.changeStopStatus(
      req.params.id,
      is_active,
    );
    res.json({ message: "Đổi trạng thái thành công.", data: updated });
  } catch (err) {
    console.error("[stopController.changeStatus]", err);
    res.status(err.status || 500).json({ error: err.message || "Lỗi server." });
  }
}

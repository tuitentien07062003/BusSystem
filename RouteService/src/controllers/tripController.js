import * as tripService from "../services/tripService.js";

export async function list(req, res) {
  try {
    let is_active;
    if (req.query.is_active !== undefined)
      is_active = req.query.is_active === "true";
    res.json(
      await tripService.getAllTrips({
        page: req.query.page,
        limit: req.query.limit,
        is_active,
        keyword: req.query.q || "",
      }),
    );
  } catch (e) {
    res.status(e.status || 500).json({ error: e.message });
  }
}
export async function byRoute(req, res) {
  try {
    res.json(
      await tripService.getTripsByRoute(req.params.routeId, {
        page: req.query.page,
        limit: req.query.limit,
      }),
    );
  } catch (e) {
    res.status(e.status || 500).json({ error: e.message });
  }
}
export async function getById(req, res) {
  try {
    res.json(await tripService.getTripById(req.params.id));
  } catch (e) {
    res.status(e.status || 500).json({ error: e.message });
  }
}
export async function create(req, res) {
  try {
    const r = await tripService.createTrip(req.body);
    res.status(201).json({ message: "Tạo chuyến thành công.", data: r });
  } catch (e) {
    res.status(e.status || 500).json({ error: e.message });
  }
}
export async function update(req, res) {
  try {
    const r = await tripService.updateTrip(req.params.id, req.body);
    res.json({ message: "Cập nhật thành công.", data: r });
  } catch (e) {
    res.status(e.status || 500).json({ error: e.message });
  }
}
export async function changeStatus(req, res) {
  try {
    const r = await tripService.changeTripStatus(
      req.params.id,
      req.body.is_active,
    );
    res.json({ message: "Đổi trạng thái thành công.", data: r });
  } catch (e) {
    res.status(e.status || 500).json({ error: e.message });
  }
}
// ═══════════════════════════════════════════════════════════════
// GET /trips/stats?date=2025-09-25&route_id=5
// Stats cho Dashboard Dispatch Center
// ═══════════════════════════════════════════════════════════════
export async function getStatsByDate(req, res) {
  try {
    const result = await tripService.getTripStatsByDate({
      date: req.query.date,
      route_id: req.query.route_id,
    });
    res.json(result);
  } catch (e) {
    console.error("[tripController.getStatsByDate]", e);
    res.status(e.status || 500).json({ error: e.message });
  }
}

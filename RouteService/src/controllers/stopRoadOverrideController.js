import * as svc from "../services/stopRoadOverrideService.js";

// GET /tbus/stops/:id/nearby-roads?radius_m=300
export async function getNearbyRoads(req, res) {
  try {
    const stopId = req.params.id;
    const radiusM = parseInt(req.query.radius_m) || 300;

    // Lấy tọa độ stop
    const sequelize = (await import("../config/database.js")).default;
    const { QueryTypes } = await import("sequelize");
    const rows = await sequelize.query(`
      SELECT ST_Y(geom) AS lat, ST_X(geom) AS lng
      FROM stops WHERE id = :id
    `, { replacements: { id: Number(stopId) }, type: QueryTypes.SELECT });

    if (rows.length === 0) {
      return res.status(404).json({ error: "Không tìm thấy stop." });
    }

    const data = await svc.getNearbyRoads(rows[0].lat, rows[0].lng, { radiusM });
    res.json({ data });
  } catch (e) {
    console.error("[getNearbyRoads]", e);
    res.status(e.status || 500).json({ error: e.message });
  }
}

// GET /tbus/stops/:id/override
export async function getOverride(req, res) {
  try {
    const data = await svc.getOverrideByStopId(req.params.id);
    res.json({ data });
  } catch (e) {
    res.status(e.status || 500).json({ error: e.message });
  }
}

// PUT /tbus/stops/:id/override
// Body: { road_id, note? }
export async function setOverride(req, res) {
  try {
    const { road_id, note } = req.body;
    if (!road_id) {
      return res.status(400).json({ error: "road_id là bắt buộc." });
    }
    const data = await svc.setOverride(req.params.id, road_id, note || null);
    res.json({ message: "Đã lưu override.", data });
  } catch (e) {
    console.error("[setOverride]", e);
    res.status(e.status || 500).json({ error: e.message });
  }
}

// DELETE /tbus/stops/:id/override
export async function removeOverride(req, res) {
  try {
    await svc.removeOverride(req.params.id);
    res.json({ message: "Đã xoá override." });
  } catch (e) {
    res.status(e.status || 500).json({ error: e.message });
  }
}

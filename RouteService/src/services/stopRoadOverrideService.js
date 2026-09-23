import { QueryTypes } from "sequelize";
import sequelize from "../config/database.js";

/**
 * Lấy danh sách roads gần 1 stop — để admin chọn override
 */
export async function getNearbyRoads(
  lat,
  lng,
  { radiusM = 300, limit = 30 } = {},
) {
  const rows = await sequelize.query(
    `
    SELECT
      rn.id,
      rn.name,
      rn.highway,
      rn.oneway,
      rn.lanes,
      ST_Y(ST_ClosestPoint(rn.geom, pt.geom)) AS matched_latitude,
      ST_X(ST_ClosestPoint(rn.geom, pt.geom)) AS matched_longitude,
      ROUND(ST_Distance(rn.geom::geography, pt.geom::geography)::numeric, 1) AS distance_m
    FROM road_network rn
    CROSS JOIN (
      SELECT ST_SetSRID(ST_MakePoint(:lng, :lat), 4326) AS geom
    ) pt
    WHERE ST_DWithin(rn.geom::geography, pt.geom::geography, :radiusM)
    ORDER BY ST_Distance(rn.geom::geography, pt.geom::geography) ASC
    LIMIT :limit
  `,
    {
      replacements: {
        lat: Number(lat),
        lng: Number(lng),
        radiusM: Number(radiusM),
        limit: Number(limit),
      },
      type: QueryTypes.SELECT,
    },
  );

  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    highway: r.highway,
    oneway: r.oneway,
    lanes: r.lanes,
    matched_latitude: parseFloat(r.matched_latitude),
    matched_longitude: parseFloat(r.matched_longitude),
    distance_m: parseFloat(r.distance_m),
  }));
}

/**
 * Lấy override của 1 stop
 */
export async function getOverrideByStopId(stopId) {
  const rows = await sequelize.query(
    `
    SELECT
      o.stop_id,
      o.road_id,
      o.note,
      o.created_at,
      o.updated_at,
      rn.name AS road_name,
      rn.highway,
      ST_Y(ST_ClosestPoint(rn.geom, s.geom)) AS matched_latitude,
      ST_X(ST_ClosestPoint(rn.geom, s.geom)) AS matched_longitude,
      ROUND(ST_Distance(rn.geom::geography, s.geom::geography)::numeric, 1) AS distance_m
    FROM stop_road_override o
    JOIN road_network rn ON rn.id = o.road_id
    JOIN stops s ON s.id = o.stop_id
    WHERE o.stop_id = :stopId
  `,
    {
      replacements: { stopId: Number(stopId) },
      type: QueryTypes.SELECT,
    },
  );

  if (rows.length === 0) return null;
  const r = rows[0];
  return {
    stop_id: r.stop_id,
    road_id: r.road_id,
    road_name: r.road_name,
    highway: r.highway,
    note: r.note,
    matched_latitude: parseFloat(r.matched_latitude),
    matched_longitude: parseFloat(r.matched_longitude),
    distance_m: parseFloat(r.distance_m),
    created_at: r.created_at,
    updated_at: r.updated_at,
  };
}

/**
 * Lấy override cho nhiều stops (batch) — dùng trong matcher
 */
export async function getOverridesForStops(stopIds = []) {
  if (!stopIds.length) return new Map();
  const ids = stopIds.map((id) => Number(id)).filter((n) => !isNaN(n) && n > 0);
  if (!ids.length) return new Map();

  // Build chuỗi IN bằng tay — an toàn vì chỉ chứa số nguyên
  const idList = ids.join(",");

  const rows = await sequelize.query(
    `
    SELECT
      o.stop_id,
      o.road_id,
      o.note,
      rn.name AS road_name,
      rn.highway,
      ST_Y(ST_ClosestPoint(rn.geom, s.geom)) AS matched_latitude,
      ST_X(ST_ClosestPoint(rn.geom, s.geom)) AS matched_longitude,
      ROUND(ST_Distance(rn.geom::geography, s.geom::geography)::numeric, 1) AS distance_m
    FROM stop_road_override o
    JOIN road_network rn ON rn.id = o.road_id
    JOIN stops s ON s.id = o.stop_id
    WHERE o.stop_id IN (${idList})
  `,
    {
      type: QueryTypes.SELECT,
    },
  );

  const map = new Map();
  for (const r of rows) {
    map.set(r.stop_id, {
      road_id: r.road_id,
      road_name: r.road_name,
      highway: r.highway,
      note: r.note,
      matched_latitude: parseFloat(r.matched_latitude),
      matched_longitude: parseFloat(r.matched_longitude),
      distance_m: parseFloat(r.distance_m),
    });
  }
  return map;
}

/**
 * Lưu override
 */
export async function setOverride(stopId, roadId, note = null) {
  // Kiểm tra stop và road tồn tại
  const stopCheck = await sequelize.query(
    "SELECT id FROM stops WHERE id = :stopId",
    { replacements: { stopId: Number(stopId) }, type: QueryTypes.SELECT },
  );
  if (stopCheck.length === 0) {
    const e = new Error("Không tìm thấy stop.");
    e.status = 404;
    throw e;
  }

  const roadCheck = await sequelize.query(
    "SELECT id FROM road_network WHERE id = :roadId",
    { replacements: { roadId: Number(roadId) }, type: QueryTypes.SELECT },
  );
  if (roadCheck.length === 0) {
    const e = new Error("Không tìm thấy road.");
    e.status = 404;
    throw e;
  }

  await sequelize.query(
    `
    INSERT INTO stop_road_override (stop_id, road_id, note, created_at, updated_at)
    VALUES (:stopId, :roadId, :note, NOW(), NOW())
    ON CONFLICT (stop_id)
    DO UPDATE SET road_id = EXCLUDED.road_id,
                  note = EXCLUDED.note,
                  updated_at = NOW()
  `,
    {
      replacements: { stopId: Number(stopId), roadId: Number(roadId), note },
      type: QueryTypes.INSERT,
    },
  );

  return getOverrideByStopId(stopId);
}

/**
 * Xoá override
 */
export async function removeOverride(stopId) {
  await sequelize.query(
    "DELETE FROM stop_road_override WHERE stop_id = :stopId",
    { replacements: { stopId: Number(stopId) }, type: QueryTypes.DELETE },
  );
  return { stop_id: Number(stopId) };
}

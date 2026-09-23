#!/bin/bash
set -e

echo "🔧 BE — Manual Road Override..."

# ═══════════════════════════════════════════════════════════════
# 1. Migration
# ═══════════════════════════════════════════════════════════════
mkdir -p migrations
cat <<'EOF_FILE' > migrations/005_stop_road_override.sql
-- Override thủ công: admin chọn road cụ thể cho stop
CREATE TABLE IF NOT EXISTS stop_road_override (
  stop_id INTEGER PRIMARY KEY REFERENCES stops(id) ON DELETE CASCADE,
  road_id INTEGER NOT NULL REFERENCES road_network(id) ON DELETE CASCADE,
  note TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stop_road_override_road
ON stop_road_override(road_id);
EOF_FILE

echo "📝 Chạy migration:"
echo "   psql -U postgres -d route_db -f migrations/005_stop_road_override.sql"
echo ""

# ═══════════════════════════════════════════════════════════════
# 2. Service — stopRoadOverrideService.js
# ═══════════════════════════════════════════════════════════════
cat <<'EOF_FILE' > src/services/stopRoadOverrideService.js
import { QueryTypes } from "sequelize";
import sequelize from "../config/database.js";

/**
 * Lấy danh sách roads gần 1 stop — để admin chọn override
 */
export async function getNearbyRoads(lat, lng, { radiusM = 300, limit = 30 } = {}) {
  const rows = await sequelize.query(`
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
  `, {
    replacements: {
      lat: Number(lat),
      lng: Number(lng),
      radiusM: Number(radiusM),
      limit: Number(limit),
    },
    type: QueryTypes.SELECT,
  });

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
  const rows = await sequelize.query(`
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
  `, {
    replacements: { stopId: Number(stopId) },
    type: QueryTypes.SELECT,
  });

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
  const ids = stopIds.map((id) => Number(id)).filter((n) => !isNaN(n));
  if (!ids.length) return new Map();

  const rows = await sequelize.query(`
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
    WHERE o.stop_id = ANY(:ids::int[])
  `, {
    replacements: { ids },
    type: QueryTypes.SELECT,
  });

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
    { replacements: { stopId: Number(stopId) }, type: QueryTypes.SELECT }
  );
  if (stopCheck.length === 0) {
    const e = new Error("Không tìm thấy stop."); e.status = 404; throw e;
  }

  const roadCheck = await sequelize.query(
    "SELECT id FROM road_network WHERE id = :roadId",
    { replacements: { roadId: Number(roadId) }, type: QueryTypes.SELECT }
  );
  if (roadCheck.length === 0) {
    const e = new Error("Không tìm thấy road."); e.status = 404; throw e;
  }

  await sequelize.query(`
    INSERT INTO stop_road_override (stop_id, road_id, note, created_at, updated_at)
    VALUES (:stopId, :roadId, :note, NOW(), NOW())
    ON CONFLICT (stop_id)
    DO UPDATE SET road_id = EXCLUDED.road_id,
                  note = EXCLUDED.note,
                  updated_at = NOW()
  `, {
    replacements: { stopId: Number(stopId), roadId: Number(roadId), note },
    type: QueryTypes.INSERT,
  });

  return getOverrideByStopId(stopId);
}

/**
 * Xoá override
 */
export async function removeOverride(stopId) {
  await sequelize.query(
    "DELETE FROM stop_road_override WHERE stop_id = :stopId",
    { replacements: { stopId: Number(stopId) }, type: QueryTypes.DELETE }
  );
  return { stop_id: Number(stopId) };
}
EOF_FILE

# ═══════════════════════════════════════════════════════════════
# 3. Reset rank + tích hợp override vào roadMatcherService.js
# ═══════════════════════════════════════════════════════════════
python3 -X utf8 - <<'PY'
p = "src/services/roadMatcherService.js"
with open(p, encoding="utf-8") as f:
    content = f.read()

# ── Reset rank về bản cũ ──
import re
old_rank_pattern = re.compile(
    r"const HIGHWAY_RANK_SQL = `[\s\S]*?`;",
    re.MULTILINE
)
new_rank = """const HIGHWAY_RANK_SQL = `
  CASE rn.highway
    WHEN 'trunk' THEN 1
    WHEN 'primary' THEN 2
    WHEN 'secondary' THEN 3
    WHEN 'tertiary' THEN 4
    WHEN 'trunk_link' THEN 5
    WHEN 'primary_link' THEN 6
    WHEN 'secondary_link' THEN 7
    WHEN 'tertiary_link' THEN 8
    ELSE 9
  END
`;"""

if old_rank_pattern.search(content):
    content = old_rank_pattern.sub(new_rank, content)
    print("[OK] Reset rank (trunk > primary > secondary > tertiary > links)")
else:
    print("[!] Không match rank SQL")

# ── Import override service ──
if "stopRoadOverrideService" not in content:
    content = content.replace(
        'import { haversine } from "../utils/geoUtils.js";',
        'import { haversine } from "../utils/geoUtils.js";\nimport { getOverridesForStops } from "./stopRoadOverrideService.js";'
    )
    print("[OK] Import override service")

# ── Tích hợp override vào matchStops ──
old_match_signature = """export async function matchStops(stops, {
  maxDistanceM = 100,
  skipDepots = true,
} = {}) {
  const hasTable = await checkTableExists();

  if (!hasTable) {
    return stops.map((s) => makeFallback(s));
  }

  const results = new Array(stops.length);
  const needMatch = [];

  for (let i = 0; i < stops.length; i++) {
    const s = stops[i];
    if (skipDepots && s.stop_type === 1) {
      results[i] = makeFallback(s, { skipped: true });
    } else {
      needMatch.push({ idx: i, stop: s });
    }
  }

  if (needMatch.length === 0) return results;"""

new_match_signature = """export async function matchStops(stops, {
  maxDistanceM = 100,
  skipDepots = true,
} = {}) {
  const hasTable = await checkTableExists();

  if (!hasTable) {
    return stops.map((s) => makeFallback(s));
  }

  const results = new Array(stops.length);
  const needMatch = [];

  // ── Load overrides cho tất cả stops ──
  const stopIds = stops.map((s) => s.id).filter((id) => id != null);
  let overrides = new Map();
  try {
    overrides = await getOverridesForStops(stopIds);
  } catch (err) {
    console.warn("[roadMatcher] Không load được overrides:", err.message);
  }

  for (let i = 0; i < stops.length; i++) {
    const s = stops[i];

    // ── Ưu tiên override nếu có ──
    if (overrides.has(s.id)) {
      const ov = overrides.get(s.id);
      results[i] = {
        stop_id: s.id,
        stop_name: s.stop_name,
        stop_type: s.stop_type,
        original_latitude: s.latitude,
        original_longitude: s.longitude,
        road_id: ov.road_id,
        matched_latitude: ov.matched_latitude,
        matched_longitude: ov.matched_longitude,
        road_name: ov.road_name,
        highway: ov.highway,
        distance_to_road_m: ov.distance_m,
        matched: true,
        skipped: false,
        override: true,
      };
      console.log(
        `[roadMatcher] "${s.stop_name}" → OVERRIDE "${ov.road_name}" [${ov.highway}] ${ov.distance_m}m`
      );
      continue;
    }

    if (skipDepots && s.stop_type === 1) {
      results[i] = makeFallback(s, { skipped: true });
    } else {
      needMatch.push({ idx: i, stop: s });
    }
  }

  if (needMatch.length === 0) return results;"""

if old_match_signature in content:
    content = content.replace(old_match_signature, new_match_signature)
    print("[OK] Tích hợp override vào matchStops")
else:
    print("[!] Không match matchStops signature")

with open(p, "w", encoding="utf-8") as f:
    f.write(content)
print("Đã lưu roadMatcherService.js")
PY

# ═══════════════════════════════════════════════════════════════
# 4. Controller — thêm endpoints override
# ═══════════════════════════════════════════════════════════════
cat <<'EOF_FILE' > src/controllers/stopRoadOverrideController.js
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
EOF_FILE

# ═══════════════════════════════════════════════════════════════
# 5. Routes — mount endpoints
# ═══════════════════════════════════════════════════════════════
python3 -X utf8 - <<'PY'
p = "src/routes/stopRoutes.js"
with open(p, encoding="utf-8") as f:
    content = f.read()

# Thêm import
if "stopRoadOverrideController" not in content:
    content = content.replace(
        'import * as stopController from "../controllers/stopController.js";',
        'import * as stopController from "../controllers/stopController.js";\nimport * as overrideController from "../controllers/stopRoadOverrideController.js";'
    )

# Thêm routes (trước export)
if "nearby-roads" not in content:
    content = content.replace(
        "export default router;",
        """// Road override
router.get("/:id/nearby-roads", overrideController.getNearbyRoads);
router.get("/:id/override", overrideController.getOverride);
router.put("/:id/override", overrideController.setOverride);
router.delete("/:id/override", overrideController.removeOverride);

export default router;"""
    )

with open(p, "w", encoding="utf-8") as f:
    f.write(content)
print("[OK] Đã mount override routes")
PY

echo ""
echo "═══════════════════════════════════════════"
echo "[OK] BE HOÀN THÀNH"
echo "═══════════════════════════════════════════"
echo ""
echo "📋 Endpoints mới:"
echo "   GET    /tbus/stops/:id/nearby-roads?radius_m=300"
echo "   GET    /tbus/stops/:id/override"
echo "   PUT    /tbus/stops/:id/override   { road_id, note? }"
echo "   DELETE /tbus/stops/:id/override"
echo ""
echo "⚠️  Chạy migration:"
echo "   psql -U postgres -d route_db -f migrations/005_stop_road_override.sql"
echo ""
echo "🚀 Restart BE: npm run dev"
import { QueryTypes } from "sequelize";
import sequelize from "../config/database.js";
import { haversine } from "../utils/geoUtils.js";
import { getOverridesForStops } from "./stopRoadOverrideService.js";

const matchCache = new Map();
const CACHE_MAX = 5000;

let _tableExists = null;
async function checkTableExists() {
  if (_tableExists !== null) return _tableExists;
  try {
    await sequelize.query("SELECT 1 FROM road_network LIMIT 1");
    _tableExists = true;
  } catch (err) {
    _tableExists = false;
    console.warn("[roadMatcher] Bảng road_network chưa tồn tại. Bỏ qua matching.");
  }
  return _tableExists;
}

function cacheKey(lat, lng) {
  return `${Number(lat).toFixed(6)},${Number(lng).toFixed(6)}`;
}

const HIGHWAY_FILTER = "'primary','secondary','tertiary','trunk','motorway_link','trunk_link','primary_link','secondary_link','tertiary_link'";

// ⭐ Priority ranking — số NHỎ = ưu tiên cao
const HIGHWAY_RANK_SQL = `
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
`;

// ═══════════════════════════════════════════════════════════════
// Tìm road với 2 chiến lược:
//   1. Ưu tiên highway rank cao (trunk > primary > secondary > tertiary)
//   2. Nếu rank thấp (secondary/tertiary) → thử mở rộng 300m để tìm trunk/primary
// ═══════════════════════════════════════════════════════════════
async function findBestRoad(lat, lng, maxDistM = 100, extendedM = 300) {
  // Lần 1: tìm trong bán kính gốc, sort theo rank rồi distance
  let rows = await sequelize.query(`
    SELECT
      rn.id AS road_id,
      ST_Y(ST_ClosestPoint(rn.geom, pt.geom)) AS matched_latitude,
      ST_X(ST_ClosestPoint(rn.geom, pt.geom)) AS matched_longitude,
      rn.name AS road_name,
      rn.highway,
      ST_Distance(rn.geom::geography, pt.geom::geography) AS distance_to_road_m
    FROM road_network rn
    CROSS JOIN (
      SELECT ST_SetSRID(ST_MakePoint(:lng, :lat), 4326) AS geom
    ) pt
    WHERE rn.highway IN (${HIGHWAY_FILTER})
      AND ST_DWithin(rn.geom::geography, pt.geom::geography, :maxDist)
    ORDER BY ${HIGHWAY_RANK_SQL} ASC,
             ST_Distance(rn.geom::geography, pt.geom::geography) ASC
    LIMIT 1
  `, {
    replacements: { lat: Number(lat), lng: Number(lng), maxDist: maxDistM },
    type: QueryTypes.SELECT,
  });

  // Nếu tìm thấy trunk/primary → dùng luôn
  if (rows.length > 0) {
    const r = rows[0];
    if (r.highway === "trunk" || r.highway === "primary") {
      return {
        road_id: r.road_id,
        matched_latitude: parseFloat(r.matched_latitude),
        matched_longitude: parseFloat(r.matched_longitude),
        road_name: r.road_name,
        highway: r.highway,
        distance_to_road_m: Math.round(parseFloat(r.distance_to_road_m)),
      };
    }
  }

  // Nếu best match là tertiary/secondary → thử mở rộng ra extendedM
  if (rows.length > 0 && (rows[0].highway === "tertiary" || rows[0].highway === "secondary")) {
    const extendedRows = await sequelize.query(`
      SELECT
        rn.id AS road_id,
        ST_Y(ST_ClosestPoint(rn.geom, pt.geom)) AS matched_latitude,
        ST_X(ST_ClosestPoint(rn.geom, pt.geom)) AS matched_longitude,
        rn.name AS road_name,
        rn.highway,
        ST_Distance(rn.geom::geography, pt.geom::geography) AS distance_to_road_m
      FROM road_network rn
      CROSS JOIN (
        SELECT ST_SetSRID(ST_MakePoint(:lng, :lat), 4326) AS geom
      ) pt
      WHERE rn.highway IN ('trunk','trunk_link','primary','primary_link')
        AND ST_DWithin(rn.geom::geography, pt.geom::geography, :extM)
      ORDER BY ST_Distance(rn.geom::geography, pt.geom::geography) ASC
      LIMIT 1
    `, {
      replacements: { lat: Number(lat), lng: Number(lng), extM: extendedM },
      type: QueryTypes.SELECT,
    });

    if (extendedRows.length > 0) {
      const r = extendedRows[0];
      console.log(
        `[roadMatcher] Extended match: local="${rows[0].road_name}" (${rows[0].highway}) ` +
        `→ remote="${r.road_name}" (${r.highway}, ${Math.round(r.distance_to_road_m)}m)`
      );
      return {
        road_id: r.road_id,
        matched_latitude: parseFloat(r.matched_latitude),
        matched_longitude: parseFloat(r.matched_longitude),
        road_name: r.road_name,
        highway: r.highway,
        distance_to_road_m: Math.round(parseFloat(r.distance_to_road_m)),
      };
    }
  }

  // Fallback: dùng best match trong bán kính gốc
  if (rows.length > 0) {
    const r = rows[0];
    return {
      road_id: r.road_id,
      matched_latitude: parseFloat(r.matched_latitude),
      matched_longitude: parseFloat(r.matched_longitude),
      road_name: r.road_name,
      highway: r.highway,
      distance_to_road_m: Math.round(parseFloat(r.distance_to_road_m)),
    };
  }

  return null;
}

// ═══════════════════════════════════════════════════════════════
// MATCH 1 ĐIỂM
// ═══════════════════════════════════════════════════════════════
export async function matchPointToRoad(lat, lng, { maxDistanceM = 100 } = {}) {
  const hasTable = await checkTableExists();
  if (!hasTable) return null;

  const key = cacheKey(lat, lng);
  if (matchCache.has(key)) return matchCache.get(key);

  try {
    const result = await findBestRoad(lat, lng, maxDistanceM);
    if (matchCache.size >= CACHE_MAX) {
      matchCache.delete(matchCache.keys().next().value);
    }
    matchCache.set(key, result);
    return result;
  } catch (err) {
    console.error("[roadMatcher] match error:", err.message);
    return null;
  }
}

export async function rematchToRoadId(lat, lng, roadId) {
  try {
    const rows = await sequelize.query(`
      SELECT
        rn.id AS road_id,
        ST_Y(ST_ClosestPoint(rn.geom, pt.geom)) AS matched_latitude,
        ST_X(ST_ClosestPoint(rn.geom, pt.geom)) AS matched_longitude,
        rn.name AS road_name,
        rn.highway,
        ST_Distance(rn.geom::geography, pt.geom::geography) AS distance_to_road_m
      FROM road_network rn
      CROSS JOIN (
        SELECT ST_SetSRID(ST_MakePoint(:lng, :lat), 4326) AS geom
      ) pt
      WHERE rn.id = :roadId
      LIMIT 1
    `, {
      replacements: { lat: Number(lat), lng: Number(lng), roadId },
      type: QueryTypes.SELECT,
    });

    if (rows.length === 0) return null;
    const r = rows[0];
    return {
      road_id: r.road_id,
      matched_latitude: parseFloat(r.matched_latitude),
      matched_longitude: parseFloat(r.matched_longitude),
      road_name: r.road_name,
      highway: r.highway,
      distance_to_road_m: Math.round(parseFloat(r.distance_to_road_m)),
    };
  } catch (err) {
    console.error("[roadMatcher] rematch error:", err.message);
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════
// MATCH NHIỀU STOPS
// ═══════════════════════════════════════════════════════════════
export async function matchStops(stops, {
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

  if (needMatch.length === 0) return results;

  // Cache hits
  const stillNeedMatch = [];
  for (const item of needMatch) {
    const key = cacheKey(item.stop.latitude, item.stop.longitude);
    if (matchCache.has(key)) {
      const c = matchCache.get(key);
      results[item.idx] = makeMatchResult(item.stop, c);
    } else {
      stillNeedMatch.push(item);
    }
  }

  // Match từng stop (dùng findBestRoad có extended search)
  if (stillNeedMatch.length > 0) {
    for (const item of stillNeedMatch) {
      try {
        const match = await findBestRoad(
          item.stop.latitude,
          item.stop.longitude,
          maxDistanceM
        );
        const key = cacheKey(item.stop.latitude, item.stop.longitude);
        matchCache.set(key, match);
        results[item.idx] = makeMatchResult(item.stop, match);

        // ⭐ Log chi tiết
        const matchStr = match
          ? `→ ${match.road_name || "(no name)"} [${match.highway}] ${match.distance_to_road_m}m`
          : `→ NO MATCH`;
        console.log(`[roadMatcher] "${item.stop.stop_name}" ${matchStr}`);
      } catch (err) {
        console.error("[roadMatcher] match error:", err.message);
        results[item.idx] = makeFallback(item.stop);
      }
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // POST-PROCESS: cluster fix mở rộng
  // Bắt cả trường hợp:
  //   - Cùng tên đường
  //   - Cùng highway type + gần nhau (cùng physical road, khác way)
  //   - Matched points cách xa bất thường (detour)
  // ═══════════════════════════════════════════════════════════════
  function normName(n) {
    if (!n) return '';
    return String(n)
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[đĐ]/g, 'd')
      .replace(/[^a-z0-9]+/g, ' ')
      .trim();
  }

  const TRUNK_PRIMARY = new Set(['trunk', 'primary']);
  const SECONDARY_TERTIARY = new Set(['secondary', 'tertiary']);

  for (let i = 1; i < results.length; i++) {
    const prev = results[i - 1];
    const cur = results[i];

    if (!prev || !cur) continue;
    if (prev.skipped || cur.skipped) continue;
    if (!prev.matched || !cur.matched) continue;
    if (prev.road_id === cur.road_id) continue;

    // Khoảng cách gốc
    const origDist = haversine(
      prev.original_latitude, prev.original_longitude,
      cur.original_latitude, cur.original_longitude
    );
    // Tăng ngưỡng lên 500m cho đường lớn
    const isTrunk = prev.highway === 'trunk' || prev.highway === 'primary';
    const maxOrig = isTrunk ? 500 : 250;
    if (origDist > maxOrig) continue;

    // Khoảng cách matched
    const matchedDist = haversine(
      prev.matched_latitude, prev.matched_longitude,
      cur.matched_latitude, cur.matched_longitude
    );

    // Điều kiện trigger cluster fix:
    const sameRoadName =
      prev.road_name && cur.road_name &&
      normName(prev.road_name) === normName(cur.road_name);

    // Cùng highway type + gần nhau → có thể là 2 way của cùng physical road
    const sameHighway =
      prev.highway && cur.highway &&
      prev.highway === cur.highway &&
      TRUNK_PRIMARY.has(prev.highway);

    // Detour bất thường: matched dist >> orig dist
    const isDetour = matchedDist > 80 && matchedDist > origDist * 1.5;

    const shouldFix = sameRoadName || sameHighway || isDetour;

    if (shouldFix) {
      const reason = sameRoadName ? 'same-name' :
                     sameHighway ? 'same-highway' : 'detour';

      console.log(
        `[roadMatcher] Cluster fix: "${cur.stop_name}" → cùng road với "${prev.stop_name}" ` +
        `[${reason}] orig=${Math.round(origDist)}m matched=${Math.round(matchedDist)}m ` +
        `(${prev.highway}/${cur.highway})`
      );

      const rematch = await rematchToRoadId(
        cur.original_latitude, cur.original_longitude, prev.road_id
      );

      if (rematch) {
        // Kiểm tra: sau khi rematch có quá xa không? (VD: prev.road_id đi qua rất xa cur)
        const newDist = haversine(
          rematch.matched_latitude, rematch.matched_longitude,
          cur.original_latitude, cur.original_longitude
        );

        // Chỉ accept nếu không quá xa (không > 500m)
        if (newDist <= 500) {
          results[i] = {
            ...cur,
            road_id: rematch.road_id,
            matched_latitude: rematch.matched_latitude,
            matched_longitude: rematch.matched_longitude,
            road_name: rematch.road_name,
            highway: rematch.highway,
            distance_to_road_m: rematch.distance_to_road_m,
            matched: true,
            rematched: true,
          };
          const key = cacheKey(cur.original_latitude, cur.original_longitude);
          matchCache.set(key, {
            road_id: rematch.road_id,
            matched_latitude: rematch.matched_latitude,
            matched_longitude: rematch.matched_longitude,
            road_name: rematch.road_name,
            highway: rematch.highway,
            distance_to_road_m: rematch.distance_to_road_m,
          });
        } else {
          console.log(
            `[roadMatcher]   Skip — matched point quá xa (${Math.round(newDist)}m)`
          );
        }
      }
    }
  }

  return results;
}

function makeMatchResult(stop, match) {
  return {
    stop_id: stop.id,
    stop_name: stop.stop_name,
    stop_type: stop.stop_type,
    original_latitude: stop.latitude,
    original_longitude: stop.longitude,
    road_id: match?.road_id ?? null,
    matched_latitude: match?.matched_latitude ?? stop.latitude,
    matched_longitude: match?.matched_longitude ?? stop.longitude,
    road_name: match?.road_name ?? null,
    highway: match?.highway ?? null,
    distance_to_road_m: match?.distance_to_road_m ?? null,
    matched: !!match,
    skipped: false,
  };
}

function makeFallback(stop, { skipped = false } = {}) {
  return {
    stop_id: stop.id,
    stop_name: stop.stop_name,
    stop_type: stop.stop_type,
    original_latitude: stop.latitude,
    original_longitude: stop.longitude,
    road_id: null,
    matched_latitude: stop.latitude,
    matched_longitude: stop.longitude,
    road_name: null,
    highway: null,
    distance_to_road_m: null,
    matched: false,
    skipped,
  };
}

export function clearMatchCache() {
  matchCache.clear();
  _tableExists = null;
}

export function getMatchCacheStats() {
  return { size: matchCache.size, max: CACHE_MAX, table_exists: _tableExists };
}

import { cumulativeDistancesCoords, findNearestOnLine, haversine } from "../utils/geoUtils.js";

/**
 * Validate shape trả về từ OSRM
 * Kiểm tra:
 *  - Mỗi stop có nằm trên shape không (khoảng cách < threshold)
 *  - Detour ratio (shape_dài / straight_line) có hợp lý không
 *  - Shape có bị cắt/lặp không
 */
export function validateShape(shape, stops, {
  maxStopDistanceM = 500,
  maxDetourRatio = 4,
} = {}) {
  const issues = [];

  if (!shape?.coordinates?.length) {
    return {
      ok: false,
      issues: [{ level: "error", code: "EMPTY_SHAPE", message: "Shape rỗng" }],
      stats: {},
    };
  }

  const coords = shape.coordinates;
  const cum = cumulativeDistancesCoords(coords);
  const shapeLengthM = cum[cum.length - 1];

  // Check 1: mỗi stop cách shape bao xa
  const stopDistances = [];
  for (const s of stops) {
    const snap = findNearestOnLine(coords, cum, s.latitude, s.longitude);
    stopDistances.push({
      stop_id: s.id,
      stop_name: s.stop_name,
      distance_to_shape_m: Math.round(snap.distance_to_line_m),
      distance_along_m: Math.round(snap.distance_along_m),
    });

    if (snap.distance_to_line_m > maxStopDistanceM) {
      issues.push({
        level: "warning",
        code: "STOP_FAR_FROM_SHAPE",
        message: `Stop "${s.stop_name}" cách shape ${Math.round(snap.distance_to_line_m)}m`,
        stop_id: s.id,
      });
    }
  }

  // Check 2: detour ratio
  const start = stops[0];
  const end = stops[stops.length - 1];
  const straightLine = haversine(start.latitude, start.longitude, end.latitude, end.longitude);
  const detourRatio = straightLine > 0 ? shapeLengthM / straightLine : 1;

  if (detourRatio > maxDetourRatio) {
    issues.push({
      level: "info",
      code: "HIGH_DETOUR",
      message: `Shape dài gấp ${detourRatio.toFixed(1)}× đường chim bay`,
    });
  }

  // Check 3: shape có đoạn đi vào rồi quay ra không (deadend)
  const deadendSpots = findDeadends(coords, cum, { toleranceM: 30, minDetourM: 100 });
  if (deadendSpots.length > 0) {
    issues.push({
      level: "warning",
      code: "DEADEND",
      message: `Shape có ${deadendSpots.length} đoạn quay đầu (có thể đang đi vào hẻm)`,
      spots: deadendSpots,
    });
  }

  return {
    ok: issues.filter((i) => i.level === "error").length === 0,
    issues,
    stats: {
      shape_length_m: Math.round(shapeLengthM),
      straight_line_m: Math.round(straightLine),
      detour_ratio: Math.round(detourRatio * 100) / 100,
      stops_on_shape: stopDistances.length,
      stop_distances: stopDistances,
    },
  };
}

function findDeadends(coords, cum, { toleranceM = 30, minDetourM = 100 } = {}) {
  const deadends = [];
  const maxLookahead = 60;

  for (let i = 1; i < coords.length; i++) {
    const maxJ = Math.min(i + maxLookahead, coords.length - 1);
    for (let j = i + 2; j <= maxJ; j++) {
      const dGeo = haversine(
        coords[i - 1][1], coords[i - 1][0],
        coords[j][1], coords[j][0]
      );
      if (dGeo < toleranceM) {
        const detour = cum[j] - cum[i - 1];
        if (detour > minDetourM) {
          deadends.push({
            from_idx: i - 1,
            to_idx: j,
            from_point: coords[i - 1],
            to_point: coords[j],
            detour_m: Math.round(detour),
          });
          i = j; // skip
          break;
        }
      }
    }
  }

  return deadends;
}

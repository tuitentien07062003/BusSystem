import { haversine } from "../utils/geoUtils.js";

/**
 * Validate thứ tự stops trước khi routing
 * Trả về warnings + suggestions (không block, chỉ cảnh báo)
 */
export function validateStopOrder(waypoints, {
  maxGapKm = 5,
  detourWarningRatio = 2.5,
} = {}) {
  const warnings = [];
  const stats = {
    total_distance_km: 0,
    max_gap_km: 0,
    avg_gap_km: 0,
    straight_line_km: 0,
  };

  if (waypoints.length < 2) {
    return { ok: true, warnings, stats };
  }

  // Tính khoảng cách từng đoạn
  const gaps = [];
  for (let i = 1; i < waypoints.length; i++) {
    const a = waypoints[i - 1];
    const b = waypoints[i];
    const d = haversine(a.latitude, a.longitude, b.latitude, b.longitude) / 1000;
    gaps.push(d);
  }

  const totalDist = gaps.reduce((sum, d) => sum + d, 0);
  const maxGap = Math.max(...gaps);
  const avgGap = totalDist / gaps.length;

  // Straight-line từ đầu đến cuối
  const start = waypoints[0];
  const end = waypoints[waypoints.length - 1];
  const straightLine = haversine(start.latitude, start.longitude, end.latitude, end.longitude) / 1000;

  stats.total_distance_km = Math.round(totalDist * 100) / 100;
  stats.max_gap_km = Math.round(maxGap * 100) / 100;
  stats.avg_gap_km = Math.round(avgGap * 100) / 100;
  stats.straight_line_km = Math.round(straightLine * 100) / 100;

  // Warning 1: có đoạn quá dài
  if (maxGap > maxGapKm) {
    const idx = gaps.indexOf(maxGap);
    warnings.push({
      level: "warning",
      code: "LARGE_GAP",
      message: `Đoạn ${waypoints[idx].stop_name} → ${waypoints[idx + 1].stop_name} dài ${maxGap.toFixed(1)}km`,
      from_index: idx,
      to_index: idx + 1,
    });
  }

  // Warning 2: tổng detour lớn so với straight-line
  if (straightLine > 0 && totalDist / straightLine > detourWarningRatio) {
    warnings.push({
      level: "info",
      code: "LARGE_DETOUR",
      message: `Lộ trình dài gấp ${(totalDist / straightLine).toFixed(1)}× đường chim bay — kiểm tra thứ tự stops`,
    });
  }

  // Warning 3: có đoạn quay lại (điểm gần nhau nhưng cách xa trong sequence)
  for (let i = 0; i < waypoints.length - 2; i++) {
    for (let j = i + 2; j < waypoints.length; j++) {
      const d = haversine(
        waypoints[i].latitude, waypoints[i].longitude,
        waypoints[j].latitude, waypoints[j].longitude
      ) / 1000;
      if (d < 0.2 && j - i >= 3) {
        warnings.push({
          level: "warning",
          code: "LOOP",
          message: `Stop "${waypoints[j].stop_name}" rất gần "${waypoints[i].stop_name}" nhưng cách xa trong thứ tự`,
          from_index: i,
          to_index: j,
        });
      }
    }
  }

  return {
    ok: warnings.length === 0,
    warnings,
    stats,
  };
}

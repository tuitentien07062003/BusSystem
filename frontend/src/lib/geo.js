// src/lib/geo.js
const R = 6371000;

export function haversine(lat1, lng1, lat2, lng2) {
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

// Cumulative distances cho mảng coords [[lng, lat], ...]
export function cumulativeDistancesCoords(coords) {
  if (!coords?.length) return [];
  const dists = [0];
  for (let i = 1; i < coords.length; i++) {
    const d = haversine(
      coords[i - 1][1], coords[i - 1][0],
      coords[i][1], coords[i][0]
    );
    dists.push(dists[i - 1] + d);
  }
  return dists;
}

// Tìm điểm trên shape tại khoảng cách targetM
export function findPointOnShapeAtDistance(shape, targetM) {
  if (!shape?.coordinates?.length) return null;
  const coords = shape.coordinates;
  const cum = cumulativeDistancesCoords(coords);
  if (cum.length === 1) return { lat: coords[0][1], lng: coords[0][0] };

  let lo = 0;
  let hi = cum.length - 1;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (cum[mid] < targetM) lo = mid + 1;
    else hi = mid;
  }
  const idx = Math.min(lo, coords.length - 1);
  if (idx === 0) return { lat: coords[0][1], lng: coords[0][0] };

  const p0 = coords[idx - 1];
  const p1 = coords[idx];
  const segLen = cum[idx] - cum[idx - 1];
  const t = segLen > 0 ? (targetM - cum[idx - 1]) / segLen : 0;
  return {
    lat: p0[1] + (p1[1] - p0[1]) * t,
    lng: p0[0] + (p1[0] - p0[0]) * t,
  };
}

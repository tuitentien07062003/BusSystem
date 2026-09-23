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

export function cumulativeDistances(points) {
  const dists = [0];
  for (let i = 1; i < points.length; i++) {
    dists.push(
      dists[i - 1] +
        haversine(
          points[i - 1].latitude, points[i - 1].longitude,
          points[i].latitude, points[i].longitude
        )
    );
  }
  return dists;
}

export function cumulativeDistancesCoords(coords) {
  if (!coords?.length) return [];
  const dists = [0];
  for (let i = 1; i < coords.length; i++) {
    dists.push(
      dists[i - 1] +
        haversine(coords[i - 1][1], coords[i - 1][0], coords[i][1], coords[i][0])
    );
  }
  return dists;
}

export function findNearestOnLine(coords, cumDists, lat, lng) {
  if (!coords?.length) return { index: 0, distance_along_m: 0, distance_to_line_m: 0 };

  let bestIdx = 0;
  let bestDistSq = Infinity;
  for (let i = 0; i < coords.length; i++) {
    const dx = coords[i][0] - lng;
    const dy = coords[i][1] - lat;
    const dSq = dx * dx + dy * dy;
    if (dSq < bestDistSq) {
      bestDistSq = dSq;
      bestIdx = i;
    }
  }

  let bestDistAlong = cumDists[bestIdx];
  let bestDistToLine = haversine(lat, lng, coords[bestIdx][1], coords[bestIdx][0]);

  const segIdxCandidates = [bestIdx - 1, bestIdx].filter(
    (i) => i >= 0 && i < coords.length - 1
  );
  for (const si of segIdxCandidates) {
    const p0 = coords[si];
    const p1 = coords[si + 1];
    const dx = p1[0] - p0[0];
    const dy = p1[1] - p0[1];
    const lenSq = dx * dx + dy * dy;
    if (lenSq === 0) continue;
    let t = ((lng - p0[0]) * dx + (lat - p0[1]) * dy) / lenSq;
    t = Math.max(0, Math.min(1, t));
    const projLng = p0[0] + t * dx;
    const projLat = p0[1] + t * dy;
    const distToLine = haversine(lat, lng, projLat, projLng);
    if (distToLine < bestDistToLine) {
      bestDistToLine = distToLine;
      const segLen = cumDists[si + 1] - cumDists[si];
      bestDistAlong = cumDists[si] + segLen * t;
    }
  }

  return {
    index: bestIdx,
    distance_along_m: bestDistAlong,
    distance_to_line_m: bestDistToLine,
  };
}

export function buildLineString(points) {
  return {
    type: "LineString",
    coordinates: points.map((p) => [Number(p.longitude), Number(p.latitude)]),
  };
}

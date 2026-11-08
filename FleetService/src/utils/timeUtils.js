/**
 * "HH:MM" | "HH:MM:SS" → số giây
 */
export function timeToSec(t) {
  if (!t) return 0;
  const [h, m, s = 0] = String(t).split(":").map(Number);
  return h * 3600 + m * 60 + s;
}

/**
 * số giây → "HH:MM:SS"
 */
export function secToTime(sec) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  const p = (n) => String(n).padStart(2, "0");
  return `${p(h)}:${p(m)}:${p(s)}`;
}

/**
 * "HH:MM" → "HH:MM:SS" (chuẩn hóa trước khi lưu DB)
 */
export function normalizeTime(t) {
  if (!t) return null;
  const parts = String(t).split(":");
  const h = String(parts[0] || "0").padStart(2, "0");
  const m = String(parts[1] || "0").padStart(2, "0");
  const s = String(parts[2] || "0").padStart(2, "0");
  return `${h}:${m}:${s}`;
}

/**
 * "HH:MM[:SS]" → "HH:MM" (cho response FE dễ đọc)
 */
export function trimTime(t) {
  if (!t) return null;
  return String(t).slice(0, 5);
}

/**
 * Khoảng cách giữa 2 mốc giờ (giờ) — có xử lý vắt qua đêm
 * VD: end=23:30, nextStart=04:30 → 5.0
 */
export function hoursBetween(endTime, nextStartTime) {
  const end = timeToSec(endTime);
  const start = timeToSec(nextStartTime);
  let diff = start - end;
  if (diff < 0) diff += 24 * 3600; // qua đêm
  return diff / 3600;
}

/**
 * Check 2 khoảng thời gian có overlap không
 * Chỉ dùng cho drive window, không xử lý vắt qua đêm
 */
export function timeRangesOverlap(startA, endA, startB, endB) {
  const aS = timeToSec(startA);
  const aE = timeToSec(endA);
  const bS = timeToSec(startB);
  const bE = timeToSec(endB);
  return aS < bE && bS < aE;
}

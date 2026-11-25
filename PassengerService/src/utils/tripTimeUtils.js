/**
 * "HH:MM" | "HH:MM:SS" → số giây
 */
export function timeToSec(t) {
  if (!t) return 0;
  const [h, m, s = 0] = String(t).split(":").map(Number);
  return h * 3600 + m * 60 + s;
}

/**
 * Số giây → "HH:MM:SS"
 */
export function secToTime(sec) {
  const h = Math.floor(sec / 3600) % 24;
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  const p = (n) => String(n).padStart(2, "0");
  return `${p(h)}:${p(m)}:${p(s)}`;
}

/**
 * Số giây → "HH:MM"
 */
export function secToTimeShort(sec) {
  return secToTime(sec).slice(0, 5);
}

/**
 * Tính giờ kết thúc của 1 trip
 * @param {object} trip - có start_time + travel_time_sec
 */
export function getTripEndTime(trip) {
  const startSec = timeToSec(trip.start_time);
  const travelSec = trip.travel_time_sec || 3600;
  return secToTime(startSec + travelSec);
}

/**
 * Tính giờ kết thúc trip theo số giây
 */
export function getTripEndSec(trip) {
  return timeToSec(trip.start_time) + (trip.travel_time_sec || 3600);
}

/**
 * Trip có nằm trọn trong ca không?
 * @param {object} trip
 * @param {string} driveStart - "05:00"
 * @param {string} driveEnd - "14:00"
 */
export function isTripWithinShift(trip, driveStart, driveEnd) {
  const startSec = timeToSec(trip.start_time);
  const endSec = getTripEndSec(trip);
  const shiftStart = timeToSec(driveStart);
  const shiftEnd = timeToSec(driveEnd);

  return startSec >= shiftStart && endSec <= shiftEnd;
}

/**
 * Tính tổng thời gian block (giây)
 */
export function computeBlockDurationSec(trips) {
  if (!trips || trips.length === 0) return 0;
  const firstStart = timeToSec(trips[0].start_time);
  const lastEnd = getTripEndSec(trips[trips.length - 1]);
  return lastEnd - firstStart;
}

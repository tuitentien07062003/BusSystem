/**
 * "YYYY-MM-DD" → Date object (UTC midnight)
 */
export function parseDate(s) {
  if (!s) return null;
  const [y, m, d] = String(s).split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

/**
 * Date → "YYYY-MM-DD"
 */
export function formatDate(d) {
  if (!d) return null;
  const date = d instanceof Date ? d : new Date(d);
  const p = (n) => String(n).padStart(2, "0");
  return `${date.getUTCFullYear()}-${p(date.getUTCMonth() + 1)}-${p(date.getUTCDate())}`;
}

/**
 * Cộng/trừ ngày
 */
export function addDays(dateStr, days) {
  const d = parseDate(dateStr);
  d.setUTCDate(d.getUTCDate() + days);
  return formatDate(d);
}

/**
 * Số ngày trong tháng
 */
export function daysInMonth(year, month) {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/**
 * Lấy thứ trong tuần: 0=CN, 1=T2, ..., 6=T7
 */
export function getWeekday(dateStr) {
  return parseDate(dateStr).getUTCDay();
}

/**
 * Sinh danh sách ngày trong tháng
 * @returns ["2026-10-01", "2026-10-02", ...]
 */
export function getDatesInMonth(year, month) {
  const days = daysInMonth(year, month);
  const p = (n) => String(n).padStart(2, "0");
  const result = [];
  for (let d = 1; d <= days; d++) {
    result.push(`${year}-${p(month)}-${p(d)}`);
  }
  return result;
}

/**
 * Lấy ISO week number (tuần bắt đầu thứ 2)
 */
export function getISOWeek(dateStr) {
  const date = parseDate(dateStr);
  const target = new Date(date);
  const dayNr = (date.getUTCDay() + 6) % 7; // Mon=0 ... Sun=6
  target.setUTCDate(target.getUTCDate() - dayNr + 3);
  const firstThursday = new Date(Date.UTC(target.getUTCFullYear(), 0, 4));
  const diff = target.getTime() - firstThursday.getTime();
  return 1 + Math.round(diff / (7 * 24 * 3600 * 1000));
}

/**
 * Lấy khóa tuần "YYYY-Www" — dùng để group theo tuần
 */
export function getWeekKey(dateStr) {
  const date = parseDate(dateStr);
  const year = date.getUTCFullYear();
  const week = getISOWeek(dateStr);
  return `${year}-W${String(week).padStart(2, "0")}`;
}

/**
 * "YYYY-MM" → { year, month }
 */
export function parseMonth(s) {
  const [y, m] = String(s).split("-").map(Number);
  return { year: y, month: m };
}

/**
 * "YYYY-MM" → "YYYY-MM" của tháng kế tiếp
 */
export function nextMonth(monthStr) {
  const { year, month } = parseMonth(monthStr);
  if (month === 12) return `${year + 1}-01`;
  return `${year}-${String(month + 1).padStart(2, "0")}`;
}

/**
 * Tháng lẻ hay chẵn
 */
export function isOddMonth(monthStr) {
  const { month } = parseMonth(monthStr);
  return month % 2 === 1;
}

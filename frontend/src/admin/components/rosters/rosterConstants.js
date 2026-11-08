// ═══════════════════════════════════════════════════════════════
// Màu theo shift + status
// ═══════════════════════════════════════════════════════════════
export const SHIFT_STYLES = {
  MORNING: {
    bg: "bg-[#169BA2]",
    bgLight: "bg-[#E6F4F5]",
    text: "text-white",
    textDark: "text-[#0F7075]",
    border: "border-[#169BA2]",
    label: "Sáng",
    short: "S",
  },
  EVENING: {
    bg: "bg-[#9333EA]",
    bgLight: "bg-[#F3E8FF]",
    text: "text-white",
    textDark: "text-[#6B21A8]",
    border: "border-[#9333EA]",
    label: "Tối",
    short: "T",
  },
  OFF: {
    bg: "bg-[#E5EAF0]",
    bgLight: "bg-[#F8FAFC]",
    text: "text-[#8A9AAA]",
    textDark: "text-[#8A9AAA]",
    border: "border-[#D0D7E2]",
    label: "Nghỉ",
    short: "—",
  },
  ABSENT: {
    bg: "bg-[#FEF2F2]",
    bgLight: "bg-[#FEF2F2]",
    text: "text-[#C62828]",
    textDark: "text-[#C62828]",
    border: "border-[#FFC8C8]",
    label: "Vắng",
    short: "V",
  },
  SWAPPED: {
    bg: "bg-[#FEF3E2]",
    bgLight: "bg-[#FEF3E2]",
    text: "text-[#B45309]",
    textDark: "text-[#B45309]",
    border: "border-[#FCD9A0]",
    label: "Đổi ca",
    short: "ĐC",
  },
};

export const WEEKDAY_SHORT = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

export const GROUP_LABELS = {
  A: { label: "Nhóm A", color: "text-[#0F7075]" },
  B: { label: "Nhóm B", color: "text-[#6B21A8]" },
  C: { label: "Nhóm C", color: "text-[#B45309]" },
  D: { label: "Nhóm D", color: "text-[#BE185D]" },
};

// ─── Helpers ───
export function getShiftStyle(shiftCode, status) {
  if (status === "off") return SHIFT_STYLES.OFF;
  if (status === "absent") return SHIFT_STYLES.ABSENT;
  if (status === "swapped") return SHIFT_STYLES.SWAPPED;
  if (shiftCode === "MORNING") return SHIFT_STYLES.MORNING;
  if (shiftCode === "EVENING") return SHIFT_STYLES.EVENING;
  return SHIFT_STYLES.OFF;
}

export function fmtMonthLabel(monthStr) {
  if (!monthStr) return "—";
  const [y, m] = monthStr.split("-");
  return `Tháng ${m}/${y}`;
}

export function getDaysInMonth(year, month) {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

export function buildDatesArray(monthStr) {
  const [year, m] = monthStr.split("-").map(Number);
  const days = getDaysInMonth(year, m);
  const p = (n) => String(n).padStart(2, "0");
  const arr = [];
  for (let d = 1; d <= days; d++) {
    arr.push({
      date: `${year}-${p(m)}-${p(d)}`,
      day: d,
      weekday: new Date(Date.UTC(year, m - 1, d)).getUTCDay(),
    });
  }
  return arr;
}

export const ROUTE_COLORS = {
  1: {
    bg: "bg-[#169BA2]",
    bgLight: "bg-[#E6F4F5]",
    text: "text-white",
    textDark: "text-[#0F7075]",
    border: "border-[#169BA2]",
    hex: "#169BA2",
  },
  2: {
    bg: "bg-[#E08940]",
    bgLight: "bg-[#FEF3E2]",
    text: "text-white",
    textDark: "text-[#B45309]",
    border: "border-[#E08940]",
    hex: "#E08940",
  },
  3: {
    bg: "bg-[#9333EA]",
    bgLight: "bg-[#F3E8FF]",
    text: "text-white",
    textDark: "text-[#6B21A8]",
    border: "border-[#9333EA]",
    hex: "#9333EA",
  },
};

const FALLBACK_ROUTE_COLOR = {
  bg: "bg-[#6A7A9A]",
  bgLight: "bg-[#F8FAFC]",
  text: "text-white",
  textDark: "text-[#4A5A7A]",
  border: "border-[#6A7A9A]",
  hex: "#6A7A9A",
};

export function getRouteColor(routeId) {
  return ROUTE_COLORS[routeId] || FALLBACK_ROUTE_COLOR;
}

export const STATUS_STYLES = {
  scheduled: {
    dot: "bg-[#2E7D32]",
    label: "Chờ chạy",
    text: "text-[#2E7D32]",
    bg: "bg-[#F1F8F1]",
    border: "border-[#A8D5A8]",
    pulse: false,
  },
  in_progress: {
    dot: "bg-[#E08940]",
    label: "Đang chạy",
    text: "text-[#E08940]",
    bg: "bg-[#FEF3E2]",
    border: "border-[#FCD9A0]",
    pulse: true,
  },
  completed: {
    dot: "bg-[#169BA2]",
    label: "Hoàn thành",
    text: "text-[#169BA2]",
    bg: "bg-[#E6F4F5]",
    border: "border-[#A8D5D8]",
    pulse: false,
  },
  cancelled: {
    dot: "bg-[#8A9AAA]",
    label: "Đã hủy",
    text: "text-[#8A9AAA]",
    bg: "bg-[#F8FAFC]",
    border: "border-[#E5EAF0]",
    pulse: false,
  },
};

export function getStatusStyle(status) {
  return STATUS_STYLES[status] || STATUS_STYLES.scheduled;
}

export const TIMELINE_START_HOUR = 4;
export const TIMELINE_END_HOUR = 24;
export const TIMELINE_HOURS = TIMELINE_END_HOUR - TIMELINE_START_HOUR;
export const PIXELS_PER_HOUR = 100;

export function fmtTime(t) {
  if (!t) return "—";
  return String(t).slice(0, 5);
}

export function fmtDateShort(s) {
  if (!s) return "—";
  try {
    const d = new Date(s);
    const p = (n) => String(n).padStart(2, "0");
    return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()}`;
  } catch {
    return s;
  }
}

export function fmtDateFull(s) {
  if (!s) return "—";
  const d = new Date(s);
  const days = [
    "Chủ nhật",
    "Thứ 2",
    "Thứ 3",
    "Thứ 4",
    "Thứ 5",
    "Thứ 6",
    "Thứ 7",
  ];
  return `${days[d.getDay()]}, ${fmtDateShort(s)}`;
}

export function todayStr() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function timeToHourFloat(t) {
  if (!t) return 0;
  const [h, m] = String(t).split(":").map(Number);
  return h + m / 60;
}

export function timeToPixel(t, { pixelsPerHour = PIXELS_PER_HOUR } = {}) {
  const h = timeToHourFloat(t);
  return (h - TIMELINE_START_HOUR) * pixelsPerHour;
}

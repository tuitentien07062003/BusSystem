export const SWAP_STATUS_STYLES = {
  pending: {
    bg: "bg-[#FEF3E2]",
    text: "text-[#B45309]",
    border: "border-[#FCD9A0]",
    dot: "bg-[#E08940]",
    label: "Chờ duyệt",
  },
  approved: {
    bg: "bg-[#E6F4F5]",
    text: "text-[#0F7075]",
    border: "border-[#A8D5D8]",
    dot: "bg-[#169BA2]",
    label: "Đã duyệt",
  },
  rejected: {
    bg: "bg-[#FEF2F2]",
    text: "text-[#C62828]",
    border: "border-[#FFC8C8]",
    dot: "bg-[#C62828]",
    label: "Từ chối",
  },
  completed: {
    bg: "bg-[#F1F8F1]",
    text: "text-[#2E7D32]",
    border: "border-[#A8D5A8]",
    dot: "bg-[#2E7D32]",
    label: "Hoàn thành",
  },
};

export function getSwapStatusStyle(status) {
  return SWAP_STATUS_STYLES[status] || SWAP_STATUS_STYLES.pending;
}

export function fmtDate(s) {
  if (!s) return "—";
  try {
    return new Date(s).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}

export function fmtDateShort(s) {
  if (!s) return "—";
  try {
    const d = new Date(s);
    const p = (n) => String(n).padStart(2, "0");
    return `${p(d.getDate())}/${p(d.getMonth() + 1)}`;
  } catch {
    return "—";
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
  return `${days[d.getDay()]}, ${fmtDate(s)}`;
}

export function fmtTime(t) {
  if (!t) return "—";
  return String(t).slice(0, 5);
}

export function todayStr() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

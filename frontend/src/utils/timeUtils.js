// Các hàm tiện ích xử lý thời gian
/**
 * Chuyển "HH:MM:SS" thành số giây
 * VD: "08:30:00" -> 30600
 */
export function parseTimeToSec(t) {
  const [h, m, s] = t.split(":").map(Number);
  return h * 3600 + m * 60 + s;
}

/**
 * Tính giờ hiển thị trên đồng hồ mô phỏng
 * @param {string} startTime - giờ xuất bến gốc "HH:MM:SS"
 * @param {number} elapsedSec - số giây đã trôi qua
 */
export function formatClock(startTime, elapsedSec) {
  const [h0, m0, s0] = startTime.split(":").map(Number);
  let s = s0 + Math.floor(elapsedSec);
  let m = m0 + Math.floor(s / 60);
  s %= 60;
  let h = h0 + Math.floor(m / 60);
  m %= 60;
  const p = (n) => String(n).padStart(2, "0");
  return `${p(h)}:${p(m)}:${p(s)}`;
}

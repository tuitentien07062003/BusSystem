import { parseMonth, getWeekday } from "./dateUtils.js";

// Định nghĩa 4 nhóm — off day giữ nguyên
// getUTCDay(): 0=CN, 1=T2, 2=T3, 3=T4, 4=T5, 5=T6, 6=T7
export const GROUPS = {
  A: { offDay: 2 }, // Thứ 2
  B: { offDay: 3 }, // Thứ 3
  C: { offDay: 4 }, // Thứ 4
  D: { offDay: 5 }, // Thứ 5
};

// ═══════════════════════════════════════════════════════════════
// Chia 1 nhóm thành 2 sub-group
// role1 = ceil(N/2), role2 = floor(N/2)
// ═══════════════════════════════════════════════════════════════
export function splitGroupIntoRoles(employees, ceilSide = "ceil") {
  const sorted = [...employees].sort((a, b) =>
    String(a.employee_code).localeCompare(String(b.employee_code)),
  );
  const ceilSize = Math.ceil(sorted.length / 2);
  const floorSize = sorted.length - ceilSize;

  const role1Size = ceilSide === "ceil" ? ceilSize : floorSize;
  return {
    role1: sorted.slice(0, role1Size),
    role2: sorted.slice(role1Size),
  };
}

// ═══════════════════════════════════════════════════════════════
// Shift của role theo tháng
// Tháng chẵn (10, 12): role1 = MORNING, role2 = EVENING
// Tháng lẻ (11): role1 = EVENING, role2 = MORNING
// ═══════════════════════════════════════════════════════════════
export function getShiftForRole(roleIdx, monthStr) {
  const { month } = parseMonth(monthStr);
  const isEvenMonth = month % 2 === 0;

  if (isEvenMonth) {
    return roleIdx === 1 ? "MORNING" : "EVENING";
  }
  return roleIdx === 1 ? "EVENING" : "MORNING";
}

// ═══════════════════════════════════════════════════════════════
// Ngày xoay ca = ngày off cố định trong tuần cuối tháng
// "Tuần cuối tháng" = tuần chứa ngày cuối cùng của tháng (t2→cn)
// ═══════════════════════════════════════════════════════════════
export function getRotationDate(groupName, monthStr) {
  const { year, month } = parseMonth(monthStr);
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const lastDay = new Date(Date.UTC(year, month - 1, daysInMonth));
  const lastDayOfWeek = lastDay.getUTCDay(); // 0..6

  // Tìm ngày thứ 2 của tuần cuối
  let mondayOfLastWeek;
  if (lastDayOfWeek === 0) {
    // Chủ nhật → monday = lastDay - 6
    mondayOfLastWeek = daysInMonth - 6;
  } else {
    // T2..T7 → monday = lastDay - (lastDayOfWeek - 1)
    mondayOfLastWeek = daysInMonth - (lastDayOfWeek - 1);
  }

  const offDay = GROUPS[groupName].offDay;

  // offset từ monday: offDay=1(T2)→0, 2(T3)→1, ..., 0(CN)→6
  let offset;
  if (offDay === 0) offset = 6;
  else offset = offDay - 1;

  let rotationDay = mondayOfLastWeek + offset;

  // Nếu vượt quá số ngày trong tháng → lùi 1 tuần
  if (rotationDay > daysInMonth) {
    rotationDay -= 7;
  }

  const p = (n) => String(n).padStart(2, "0");
  return `${year}-${p(month)}-${p(rotationDay)}`;
}

// ═══════════════════════════════════════════════════════════════
// Check ngày X có phải ngày off cố định của nhóm
// ═══════════════════════════════════════════════════════════════
export function isWeeklyOffDay(dateStr, groupName) {
  return getWeekday(dateStr) === GROUPS[groupName].offDay;
}

export function getGroupCeilSide(groupName) {
  // A, C lấy ceil (8/7) — B, D lấy floor (7/8)
  return groupName === "A" || groupName === "C" ? "ceil" : "floor";
}

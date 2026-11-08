import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_FLEET_API_BASE_URL || "/fleet",
  timeout: 20000,
});

// ═══════════════════════════════════════════════════════════════
// LIST — phân trang
// ═══════════════════════════════════════════════════════════════
export async function fetchRosters({
  from,
  to,
  employee_id,
  shift_template_id,
  status,
  depot_id,
  page = 1,
  limit = 100,
} = {}) {
  const params = { page, limit };
  if (from) params.from = from;
  if (to) params.to = to;
  if (employee_id) params.employee_id = employee_id;
  if (shift_template_id) params.shift_template_id = shift_template_id;
  if (status) params.status = status;
  if (depot_id) params.depot_id = depot_id;
  const res = await api.get("/rosters", { params });
  return res.data;
}

// ═══════════════════════════════════════════════════════════════
// MONTH — lấy toàn bộ roster 1 tháng (dùng cho calendar)
// limit cao để cover hết 60 driver × 31 ngày
// ═══════════════════════════════════════════════════════════════
export async function fetchRostersMonth({ month, depot_id } = {}) {
  if (!month) throw new Error("month là bắt buộc");
  const [year, m] = month.split("-").map(Number);
  const daysInMonth = new Date(Date.UTC(year, m, 0)).getUTCDate();
  const p = (n) => String(n).padStart(2, "0");
  const from = `${year}-${p(m)}-01`;
  const to = `${year}-${p(m)}-${p(daysInMonth)}`;

  const LIMIT = 500;
  const all = [];
  let page = 1;
  let totalPages = 1;

  do {
    const res = await api.get("/rosters", {
      params: { from, to, depot_id, page, limit: LIMIT },
    });
    all.push(...(res.data.data || []));
    totalPages = res.data.totalPages || 1;
    page++;
  } while (page <= totalPages);

  return { data: all, total: all.length };
}

// ═══════════════════════════════════════════════════════════════
// BY EMPLOYEE — lịch 1 nhân viên
// ═══════════════════════════════════════════════════════════════
export async function fetchRostersByEmployee(employeeId, { from, to } = {}) {
  const params = {};
  if (from) params.from = from;
  if (to) params.to = to;
  const res = await api.get(`/rosters/by-employee/${employeeId}`, { params });
  return res.data;
}

// ═══════════════════════════════════════════════════════════════
// GET BY ID
// ═══════════════════════════════════════════════════════════════
export async function fetchRosterById(id) {
  const res = await api.get(`/rosters/${id}`);
  return res.data;
}

// ═══════════════════════════════════════════════════════════════
// UPDATE — đổi ca 1 người (có force option khi vi phạm 11h)
// ═══════════════════════════════════════════════════════════════
export async function updateRoster(id, payload) {
  const res = await api.put(`/rosters/${id}`, payload);
  return res.data;
}

// ═══════════════════════════════════════════════════════════════
// CHANGE STATUS
// ═══════════════════════════════════════════════════════════════
export async function changeRosterStatus(id, status) {
  const res = await api.patch(`/rosters/${id}/status`, { status });
  return res.data;
}

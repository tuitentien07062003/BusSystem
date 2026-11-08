import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import * as api from "@/api/rostersApi";

// ═══════════════════════════════════════════════════════════════
// LIST
// ═══════════════════════════════════════════════════════════════
export function useRostersList({
  from,
  to,
  employee_id,
  shift_template_id,
  status,
  depot_id,
  page = 1,
  limit = 100,
} = {}) {
  return useQuery({
    queryKey: [
      "rosters",
      "list",
      {
        from,
        to,
        employee_id,
        shift_template_id,
        status,
        depot_id,
        page,
        limit,
      },
    ],
    queryFn: () =>
      api.fetchRosters({
        from,
        to,
        employee_id,
        shift_template_id,
        status,
        depot_id,
        page,
        limit,
      }),
    placeholderData: (prev) => prev,
    staleTime: 30 * 1000,
  });
}

// ═══════════════════════════════════════════════════════════════
// MONTH — dùng cho calendar
// ═══════════════════════════════════════════════════════════════
export function useRostersMonth({ month, depot_id } = {}) {
  return useQuery({
    queryKey: ["rosters", "month", { month, depot_id }],
    queryFn: () => api.fetchRostersMonth({ month, depot_id }),
    enabled: !!month,
    staleTime: 60 * 1000,
  });
}

// ═══════════════════════════════════════════════════════════════
// BY EMPLOYEE
// ═══════════════════════════════════════════════════════════════
export function useRostersByEmployee(
  employeeId,
  { from, to, enabled = true } = {},
) {
  return useQuery({
    queryKey: ["rosters", "by-employee", employeeId, { from, to }],
    queryFn: () => api.fetchRostersByEmployee(employeeId, { from, to }),
    enabled: !!employeeId && enabled,
    staleTime: 60 * 1000,
  });
}

// ═══════════════════════════════════════════════════════════════
// UPDATE — đổi ca
// ═══════════════════════════════════════════════════════════════
export function useUpdateRoster() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }) => api.updateRoster(id, payload),
    onSuccess: () => {
      toast.success("Đã cập nhật ca");
      qc.invalidateQueries({ queryKey: ["rosters"] });
    },
    onError: (err) => {
      const msg = err?.response?.data?.error || err.message;
      const status = err?.response?.status;
      if (status === 409) {
        // Vi phạm 11h → hiện toast warning, không phải error
        toast.warning("Vi phạm ràng buộc", {
          description: msg,
          duration: 6000,
        });
      } else {
        toast.error("Cập nhật thất bại", { description: msg });
      }
    },
  });
}

// ═══════════════════════════════════════════════════════════════
// CHANGE STATUS
// ═══════════════════════════════════════════════════════════════
export function useChangeRosterStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }) => api.changeRosterStatus(id, status),
    onSuccess: (_, v) => {
      toast.success(`Đã đổi trạng thái thành "${v.status}"`);
      qc.invalidateQueries({ queryKey: ["rosters"] });
    },
    onError: (err) =>
      toast.error("Đổi trạng thái thất bại", {
        description: err?.response?.data?.error || err.message,
      }),
  });
}

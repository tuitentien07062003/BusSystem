import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import * as api from "@/api/shiftSwapsApi";

export function useSwapsList({
  from,
  to,
  original_employee_id,
  substitute_employee_id,
  status,
  page = 1,
  limit = 50,
} = {}) {
  return useQuery({
    queryKey: [
      "swaps",
      "list",
      {
        from,
        to,
        original_employee_id,
        substitute_employee_id,
        status,
        page,
        limit,
      },
    ],
    queryFn: () =>
      api.fetchSwaps({
        from,
        to,
        original_employee_id,
        substitute_employee_id,
        status,
        page,
        limit,
      }),
    placeholderData: (prev) => prev,
    staleTime: 30 * 1000,
  });
}

export function useSwapsByDate(date) {
  return useQuery({
    queryKey: ["swaps", "by-date", date],
    queryFn: () => api.fetchSwapsByDate(date),
    enabled: !!date,
    staleTime: 30 * 1000,
  });
}

export function useSwapStats({ from, to } = {}) {
  return useQuery({
    queryKey: ["swaps", "stats", { from, to }],
    queryFn: () => api.fetchSwapStats({ from, to }),
    staleTime: 60 * 1000,
  });
}

export function useSuggestSubstitutes() {
  return useMutation({
    mutationFn: api.suggestSubstitutes,
    onError: (err) => {
      toast.error("Không thể tìm người thay thế", {
        description: err?.response?.data?.error || err.message,
        duration: 6000,
      });
    },
  });
}

export function useCreateSwap() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.createSwap,
    onSuccess: (data) => {
      const msg = `Đã swap ${data.original_employee?.employee_code || ""} → ${
        data.substitute_employee?.employee_code || ""
      }`;
      toast.success(msg);
      qc.invalidateQueries({ queryKey: ["swaps"] });
      qc.invalidateQueries({ queryKey: ["assignments"] });
      qc.invalidateQueries({ queryKey: ["rosters"] });
    },
    onError: (err) => {
      const msg = err?.response?.data?.error || err.message;
      const errors = err?.response?.data?.validation?.errors || [];
      toast.error("Swap thất bại", {
        description: errors.length > 0 ? errors.join(" · ") : msg,
        duration: 8000,
      });
    },
  });
}

export function useDeleteSwap() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.deleteSwap,
    onSuccess: () => {
      toast.success("Đã xóa bản ghi swap");
      qc.invalidateQueries({ queryKey: ["swaps"] });
    },
    onError: (err) =>
      toast.error("Xóa thất bại", {
        description: err?.response?.data?.error || err.message,
      }),
  });
}

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import * as api from "@/api/routeOperationsApi";

export const routeOpsKeys = {
  all: ["route-operations"],
  detail: (routeId) => [...routeOpsKeys.all, "detail", routeId],
  statsByDate: (routeId, date) => [...routeOpsKeys.all, "stats", routeId, date],
};

// ═══════════════════════════════════════════════════════════════
// GET OPERATIONS — metadata + stats cache
// ═══════════════════════════════════════════════════════════════

/**
 * Lấy metadata vận hành + stats cache của tuyến
 * @param {number} routeId
 * @param {Object} options - { enabled? }
 */
export function useRouteOperations(routeId, { enabled = true } = {}) {
  return useQuery({
    queryKey: routeOpsKeys.detail(routeId),
    queryFn: () => api.getRouteOperations(routeId),
    enabled: !!routeId && enabled,
    staleTime: 30 * 1000, // 30s
  });
}

// ═══════════════════════════════════════════════════════════════
// ACTIVATE — kích hoạt tuyến
// ═══════════════════════════════════════════════════════════════

export function useActivateRoute() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ routeId, payload }) => api.activateRoute(routeId, payload),
    onSuccess: (data, vars) => {
      const msg = data?.data?.warning
        ? "Đã kích hoạt tuyến (chưa có chuyến)"
        : "Đã kích hoạt tuyến";
      toast.success(msg);
      qc.invalidateQueries({ queryKey: routeOpsKeys.detail(vars.routeId) });
      qc.invalidateQueries({ queryKey: ["routes"] });
    },
    onError: (err) => {
      toast.error("Kích hoạt thất bại", {
        description: err?.response?.data?.error || err.message,
      });
    },
  });
}

// ═══════════════════════════════════════════════════════════════
// DEACTIVATE — hủy kích hoạt
// ═══════════════════════════════════════════════════════════════

export function useDeactivateRoute() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (routeId) => api.deactivateRoute(routeId),
    onSuccess: (_, routeId) => {
      toast.success("Đã hủy kích hoạt tuyến");
      qc.invalidateQueries({ queryKey: routeOpsKeys.detail(routeId) });
      qc.invalidateQueries({ queryKey: ["routes"] });
    },
    onError: (err) => {
      toast.error("Hủy kích hoạt thất bại", {
        description: err?.response?.data?.error || err.message,
      });
    },
  });
}

// ═══════════════════════════════════════════════════════════════
// UPDATE OPERATIONS — sửa metadata
// ═══════════════════════════════════════════════════════════════

export function useUpdateRouteOperations() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ routeId, payload }) =>
      api.updateRouteOperations(routeId, payload),
    onSuccess: (_, vars) => {
      toast.success("Đã cập nhật thông tin vận hành");
      qc.invalidateQueries({ queryKey: routeOpsKeys.detail(vars.routeId) });
    },
    onError: (err) => {
      toast.error("Cập nhật thất bại", {
        description: err?.response?.data?.error || err.message,
      });
    },
  });
}

// ═══════════════════════════════════════════════════════════════
// STATS BY DATE — số chuyến + giãn cách
// ═══════════════════════════════════════════════════════════════

/**
 * Lấy stats theo ngày
 * @param {number} routeId
 * @param {string} date - "YYYY-MM-DD"
 * @param {Object} options - { enabled? }
 */
export function useRouteStatsByDate(routeId, date, { enabled = true } = {}) {
  return useQuery({
    queryKey: routeOpsKeys.statsByDate(routeId, date),
    queryFn: () => api.getRouteStatsByDate(routeId, date),
    enabled: !!routeId && !!date && enabled,
    staleTime: 60 * 1000, // 1 phút
    placeholderData: (prev) => prev, // giữ data cũ khi đổi ngày
  });
}

// ═══════════════════════════════════════════════════════════════
// RECOMPUTE STATS — tính lại cache
// ═══════════════════════════════════════════════════════════════

export function useRecomputeRouteStats() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (routeId) => api.recomputeRouteStats(routeId),
    onSuccess: (_, routeId) => {
      toast.success("Đã tính lại số liệu tuyến");
      qc.invalidateQueries({ queryKey: routeOpsKeys.detail(routeId) });
    },
    onError: (err) => {
      toast.error("Tính lại thất bại", {
        description: err?.response?.data?.error || err.message,
      });
    },
  });
}

// ═══════════════════════════════════════════════════════════════
// PREVIEW TRIPS — xem trước (không insert)
// ═══════════════════════════════════════════════════════════════

/**
 * Preview trips — dùng mutation vì chỉ chạy khi user bấm
 * Không cache, không auto-trigger
 */
export function usePreviewTrips() {
  return useMutation({
    mutationFn: ({ routeId, payload }) => api.previewTrips(routeId, payload),
    onError: (err) => {
      toast.error("Không xem trước được", {
        description: err?.response?.data?.error || err.message,
      });
    },
  });
}

// ═══════════════════════════════════════════════════════════════
// GENERATE TRIPS — sinh + insert
// ═══════════════════════════════════════════════════════════════

export function useGenerateTrips() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ routeId, payload }) => api.generateTrips(routeId, payload),
    onSuccess: (data, vars) => {
      const count = data?.data?.inserted ?? 0;
      toast.success(`Đã sinh ${count} chuyến`);
      // Invalidate để stats cập nhật lại
      qc.invalidateQueries({ queryKey: routeOpsKeys.detail(vars.routeId) });
      qc.invalidateQueries({ queryKey: ["trips"] });
    },
    onError: (err) => {
      toast.error("Sinh chuyến thất bại", {
        description: err?.response?.data?.error || err.message,
      });
    },
  });
}

// ═══════════════════════════════════════════════════════════════
// REGENERATE TRIPS — sinh lại
// ═══════════════════════════════════════════════════════════════

export function useRegenerateTrips() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ routeId, payload }) => api.regenerateTrips(routeId, payload),
    onSuccess: (data, vars) => {
      const count = data?.data?.inserted ?? 0;
      toast.success(`Đã sinh lại ${count} chuyến`);
      qc.invalidateQueries({ queryKey: routeOpsKeys.detail(vars.routeId) });
      qc.invalidateQueries({ queryKey: ["trips"] });
    },
    onError: (err) => {
      toast.error("Sinh lại thất bại", {
        description: err?.response?.data?.error || err.message,
      });
    },
  });
}

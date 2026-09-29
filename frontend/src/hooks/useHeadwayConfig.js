import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import * as api from "@/api/headwayConfigApi";

export const headwayKeys = {
  all: ["headway-configs"],
  byRoute: (routeId) => [...headwayKeys.all, routeId],
};

// ═══════════════════════════════════════════════════════════════
// Lấy configs của tuyến
// ═══════════════════════════════════════════════════════════════
export function useHeadwayConfigs(routeId, { enabled = true } = {}) {
  return useQuery({
    queryKey: headwayKeys.byRoute(routeId),
    queryFn: () => api.fetchHeadwayConfigs(routeId),
    enabled: !!routeId && enabled,
    staleTime: 30 * 1000,
  });
}

// ═══════════════════════════════════════════════════════════════
// Lưu configs (bulk replace)
// ═══════════════════════════════════════════════════════════════
export function useReplaceHeadwayConfigs() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ routeId, configs }) =>
      api.replaceHeadwayConfigs(routeId, configs),
    onSuccess: (data, vars) => {
      toast.success("Đã lưu cấu hình khung giờ");
      if (data?.warnings?.length > 0) {
        data.warnings.forEach((w) => {
          toast.warning(w, { duration: 5000 });
        });
      }
      qc.invalidateQueries({ queryKey: headwayKeys.byRoute(vars.routeId) });
    },
    onError: (err) => {
      toast.error("Lưu thất bại", {
        description: err?.response?.data?.error || err.message,
      });
    },
  });
}

// ═══════════════════════════════════════════════════════════════
// Xóa hết configs
// ═══════════════════════════════════════════════════════════════
export function useClearHeadwayConfigs() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (routeId) => api.clearHeadwayConfigs(routeId),
    onSuccess: (_, routeId) => {
      toast.success("Đã xóa cấu hình khung giờ");
      qc.invalidateQueries({ queryKey: headwayKeys.byRoute(routeId) });
    },
    onError: (err) => {
      toast.error("Xóa thất bại", {
        description: err?.response?.data?.error || err.message,
      });
    },
  });
}

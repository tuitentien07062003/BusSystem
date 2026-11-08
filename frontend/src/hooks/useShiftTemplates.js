import { useQuery } from "@tanstack/react-query";
import * as api from "@/api/shiftTemplatesApi";

export function useShiftTemplates({ is_active } = {}) {
  return useQuery({
    queryKey: ["shift-templates", "list", { is_active }],
    queryFn: () => api.fetchShiftTemplates({ is_active }),
    staleTime: 5 * 60 * 1000,
  });
}

export function useActiveShiftTemplates() {
  return useQuery({
    queryKey: ["shift-templates", "active"],
    queryFn: api.fetchActiveShiftTemplates,
    staleTime: 5 * 60 * 1000,
  });
}

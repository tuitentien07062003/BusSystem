import { useQuery } from "@tanstack/react-query";
import * as api from "@/api/unavailabilityApi";

export function useUnavailabilityList({
  driver_id,
  from,
  to,
  page = 1,
  limit = 20,
  enabled = true,
} = {}) {
  return useQuery({
    queryKey: ["unavailability", "list", { driver_id, from, to, page, limit }],
    queryFn: () =>
      api.fetchUnavailability({ driver_id, from, to, page, limit }),
    enabled: !!driver_id && enabled,
    staleTime: 60 * 1000,
  });
}

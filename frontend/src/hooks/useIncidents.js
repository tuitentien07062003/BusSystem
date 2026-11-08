import { useQuery } from "@tanstack/react-query";
import * as api from "@/api/incidentsApi";

export function useIncidentsList({
  vehicle_id,
  driver_id,
  route_id,
  status,
  from,
  to,
  page = 1,
  limit = 20,
  enabled = true,
} = {}) {
  return useQuery({
    queryKey: [
      "incidents",
      "list",
      { vehicle_id, driver_id, route_id, status, from, to, page, limit },
    ],
    queryFn: () =>
      api.fetchIncidents({
        vehicle_id,
        driver_id,
        route_id,
        status,
        from,
        to,
        page,
        limit,
      }),
    enabled: !!vehicle_id && enabled,
    staleTime: 60 * 1000,
  });
}

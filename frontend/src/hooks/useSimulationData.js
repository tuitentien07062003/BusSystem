import { useQuery } from "@tanstack/react-query";
import * as api from "@/api/simulationApi";

export function useFullRouteForSim(routeId) {
  return useQuery({
    queryKey: ["sim", "full-route", routeId],
    queryFn: () => api.fetchFullRoute(routeId),
    enabled: !!routeId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useRouteTrips(routeId, limit = 30) {
  return useQuery({
    queryKey: ["sim", "trips", routeId, limit],
    queryFn: () => api.fetchRouteTrips(routeId, limit),
    enabled: !!routeId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useSimAssignments({ date, route_id, enabled = true }) {
  return useQuery({
    queryKey: ["sim", "assignments", { date, route_id }],
    queryFn: () => api.fetchSimAssignments({ date, route_id }),
    enabled: !!date && enabled,
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });
}

import { useMemo } from "react";
import { useRoutesList } from "@/hooks/useRoutes";
import { useStopsList } from "@/hooks/useStops";

export function useNameLookups() {
  const { data: routesData } = useRoutesList({ page: 1, limit: 500 });
  const { data: depotsData } = useStopsList({
    page: 1,
    limit: 500,
    stop_type: 1,
  });

  const routeMap = useMemo(() => {
    const m = new Map();
    (routesData?.data || []).forEach((r) => {
      m.set(r.id, r.route_short_name || r.route_full_name || `Tuyến #${r.id}`);
    });
    return m;
  }, [routesData]);

  const depotMap = useMemo(() => {
    const m = new Map();
    (depotsData?.data || []).forEach((d) => {
      m.set(d.id, d.stop_name || d.stop_id || `Depot #${d.id}`);
    });
    return m;
  }, [depotsData]);

  return {
    getRouteName: (id) =>
      id == null ? "—" : routeMap.get(id) || `Tuyến #${id}`,
    getDepotName: (id) =>
      id == null ? "—" : depotMap.get(id) || `Depot #${id}`,
  };
}

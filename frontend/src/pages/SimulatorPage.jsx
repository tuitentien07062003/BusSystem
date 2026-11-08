import { useEffect, useMemo } from "react";
import { toast } from "sonner";
import { Sidebar } from "@/components/Sidebar/Sidebar";
import { MapView } from "@/components/MapView";
import { useSimulation } from "@/hooks/useSimulation";
import { useRoutesList } from "@/hooks/useRoutes";
import {
  useFullRouteForSim,
  useRouteTrips,
  useSimAssignments,
} from "@/hooks/useSimulationData";

function todayStr() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function SimulatorPage() {
  const {
    selectedRouteId,
    setSelectedRouteId,
    setRoutesList,
    loadSimData,
    reset,
  } = useSimulation();

  const today = todayStr();

  // Routes list
  const { data: routesData, isLoading: loadingRoutes } = useRoutesList({
    page: 1,
    limit: 100,
  });

  useEffect(() => {
    if (routesData?.data) {
      setRoutesList(routesData.data);
      if (!selectedRouteId && routesData.data.length > 0) {
        setSelectedRouteId(String(routesData.data[0].id));
      }
    }
  }, [routesData, setRoutesList, selectedRouteId, setSelectedRouteId]);

  // Route detail (shape + stops)
  const {
    data: fullRoute,
    isLoading: loadingFull,
    isError: errorFull,
    error: fullError,
  } = useFullRouteForSim(selectedRouteId);

  // Trips
  const { data: tripsData, isLoading: loadingTrips } = useRouteTrips(
    selectedRouteId,
    500,
  );

  // Assignments
  const { data: assignmentsData, isLoading: loadingAssignments } =
    useSimAssignments({
      date: today,
      route_id: selectedRouteId,
    });

  // Load into engine
  useEffect(() => {
    if (!fullRoute?.patterns || !tripsData?.data) return;

    const patterns = fullRoute.patterns.filter(
      (p) => p.shape?.coordinates?.length > 0 && p.stops?.length > 0,
    );

    if (patterns.length === 0) {
      toast.error("Tuyến chưa có lộ trình đầy đủ");
      return;
    }

    const assignments = assignmentsData?.data || [];

    if (assignments.length === 0) {
      toast.warning(`Chưa có phân công nào cho tuyến hôm nay (${today})`, {
        description:
          "Vào /admin/assignments để tạo phân công trước khi mô phỏng.",
        duration: 5000,
      });
    }

    loadSimData(patterns, tripsData.data, assignments);
  }, [fullRoute, tripsData, assignmentsData, loadSimData]);

  useEffect(() => {
    reset();
  }, [selectedRouteId, reset]);

  useEffect(() => {
    if (errorFull) {
      toast.error("Không tải được tuyến", {
        description: fullError?.response?.data?.error || fullError?.message,
      });
    }
  }, [errorFull, fullError]);

  const isLoading =
    loadingRoutes || loadingFull || loadingTrips || loadingAssignments;

  return (
    <div className="flex w-screen h-screen overflow-hidden">
      <Sidebar isLoading={isLoading} />
      <div className="flex-1 relative">
        {isLoading && (
          <div className="absolute inset-0 z-[500] bg-black/40 backdrop-blur-sm flex flex-col items-center justify-center">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-[#169BA2] border-t-transparent mb-3" />
            <p className="text-sm text-white">Đang tải dữ liệu mô phỏng...</p>
          </div>
        )}
        <MapView />
      </div>
    </div>
  );
}

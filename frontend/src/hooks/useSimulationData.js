import { useQuery } from "@tanstack/react-query";
import { fetchSimulationBatch } from "@/api/simulationApi";

export function useSimulationData(direction, limit = 30) {
  return useQuery({
    queryKey: ["simulation", direction, limit],
    queryFn: () => fetchSimulationBatch(direction, limit),
    staleTime: 5 * 60 * 1000, // 5 phút coi như fresh
    retry: 1,
    enabled: !!direction,
  });
}

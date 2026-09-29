import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import * as api from "@/api/tripsApi";

export function useTripsList({ page = 1, limit = 20, is_active, q = "" } = {}) {
  return useQuery({
    queryKey: ["trips", "list", { page, limit, is_active, q }],
    queryFn: () => api.fetchTrips({ page, limit, is_active, q }),
    placeholderData: (prev) => prev,
  });
}

export function useTripsByRoute(routeId, { page = 1, limit = 20 } = {}) {
  return useQuery({
    queryKey: ["trips", "by-route", routeId, { page, limit }],
    queryFn: () => api.fetchTripsByRoute(routeId, { page, limit }),
    enabled: !!routeId,
    placeholderData: (prev) => prev,
  });
}

export function useCreateTrip() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.createTrip,
    onSuccess: () => {
      toast.success("Đã tạo chuyến");
      qc.invalidateQueries({ queryKey: ["trips"] });
    },
    onError: (err) =>
      toast.error("Tạo thất bại", {
        description: err?.response?.data?.error || err.message,
      }),
  });
}

export function useUpdateTrip() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }) => api.updateTrip(id, payload),
    onSuccess: () => {
      toast.success("Đã cập nhật");
      qc.invalidateQueries({ queryKey: ["trips"] });
    },
    onError: (err) =>
      toast.error("Cập nhật thất bại", {
        description: err?.response?.data?.error || err.message,
      }),
  });
}

export function useChangeTripStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, is_active }) => api.changeTripStatus(id, is_active),
    onSuccess: (_, v) => {
      toast.success(v.is_active ? "Đã kích hoạt" : "Đã ngưng");
      qc.invalidateQueries({ queryKey: ["trips"] });
    },
    onError: (err) =>
      toast.error("Đổi trạng thái thất bại", {
        description: err?.response?.data?.error || err.message,
      }),
  });
}

export function useTripsStatsByDate(date, routeId) {
  return useQuery({
    queryKey: ["trips", "stats-by-date", date, routeId ?? "all"],
    queryFn: () => api.fetchTripsStatsByDate({ date, route_id: routeId }),
    enabled: !!date,
    staleTime: 60 * 1000,
    placeholderData: (prev) => prev,
  });
}

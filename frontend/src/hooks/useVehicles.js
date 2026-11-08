import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import * as api from "@/api/vehiclesApi";

export function useVehiclesList({
  page = 1,
  limit = 10,
  depot_id,
  vehicle_type_id,
  is_active,
  q = "",
} = {}) {
  return useQuery({
    queryKey: [
      "vehicles",
      "list",
      { page, limit, depot_id, vehicle_type_id, is_active, q },
    ],
    queryFn: () =>
      api.fetchVehicles({
        page,
        limit,
        depot_id,
        vehicle_type_id,
        is_active,
        q,
      }),
    placeholderData: (prev) => prev,
    staleTime: 30 * 1000,
  });
}

export function useVehicleStats() {
  return useQuery({
    queryKey: ["vehicles", "stats"],
    queryFn: api.fetchVehicleStats,
    staleTime: 60 * 1000,
  });
}

export function useVehicleTypes() {
  return useQuery({
    queryKey: ["vehicles", "types"],
    queryFn: api.fetchVehicleTypes,
    staleTime: 5 * 60 * 1000,
  });
}

export function useVehicleById(id, { enabled = true } = {}) {
  return useQuery({
    queryKey: ["vehicles", "detail", id],
    queryFn: () => api.fetchVehicleById(id),
    enabled: !!id && enabled,
  });
}

export function useCreateVehicle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.createVehicle,
    onSuccess: () => {
      toast.success("Đã tạo xe");
      qc.invalidateQueries({ queryKey: ["vehicles"] });
    },
    onError: (err) =>
      toast.error("Tạo thất bại", {
        description: err?.response?.data?.error || err.message,
      }),
  });
}

export function useUpdateVehicle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }) => api.updateVehicle(id, payload),
    onSuccess: () => {
      toast.success("Đã cập nhật xe");
      qc.invalidateQueries({ queryKey: ["vehicles"] });
    },
    onError: (err) =>
      toast.error("Cập nhật thất bại", {
        description: err?.response?.data?.error || err.message,
      }),
  });
}

export function useChangeVehicleStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, is_active }) => api.changeVehicleStatus(id, is_active),
    onSuccess: (_, v) => {
      toast.success(v.is_active ? "Đã kích hoạt" : "Đã ngưng hoạt động");
      qc.invalidateQueries({ queryKey: ["vehicles"] });
    },
    onError: (err) =>
      toast.error("Đổi trạng thái thất bại", {
        description: err?.response?.data?.error || err.message,
      }),
  });
}

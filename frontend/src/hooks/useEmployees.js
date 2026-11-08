import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import * as api from "@/api/employeesApi";

// ═══════════════════════════════════════════════════════════════
// DANH SÁCH
// ═══════════════════════════════════════════════════════════════
export function useEmployeesList({
  page = 1,
  limit = 20,
  type,
  is_active,
  q = "",
} = {}) {
  return useQuery({
    queryKey: ["employees", "list", { page, limit, type, is_active, q }],
    queryFn: () => api.fetchEmployees({ page, limit, type, is_active, q }),
    placeholderData: (prev) => prev,
    staleTime: 30 * 1000,
  });
}

// ═══════════════════════════════════════════════════════════════
// THỐNG KÊ
// ═══════════════════════════════════════════════════════════════
export function useEmployeeStats() {
  return useQuery({
    queryKey: ["employees", "stats"],
    queryFn: api.fetchEmployeeStats,
    staleTime: 60 * 1000,
  });
}

// ═══════════════════════════════════════════════════════════════
// CHI TIẾT
// ═══════════════════════════════════════════════════════════════
export function useEmployeeById(id, { enabled = true } = {}) {
  return useQuery({
    queryKey: ["employees", "detail", id],
    queryFn: () => api.fetchEmployeeById(id),
    enabled: !!id && enabled,
  });
}

// ═══════════════════════════════════════════════════════════════
// TẠO MỚI
// ═══════════════════════════════════════════════════════════════
export function useCreateEmployee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.createEmployee,
    onSuccess: () => {
      toast.success("Đã tạo nhân viên");
      qc.invalidateQueries({ queryKey: ["employees"] });
    },
    onError: (err) =>
      toast.error("Tạo thất bại", {
        description: err?.response?.data?.error || err.message,
      }),
  });
}

// ═══════════════════════════════════════════════════════════════
// CẬP NHẬT
// ═══════════════════════════════════════════════════════════════
export function useUpdateEmployee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }) => api.updateEmployee(id, payload),
    onSuccess: () => {
      toast.success("Đã cập nhật nhân viên");
      qc.invalidateQueries({ queryKey: ["employees"] });
    },
    onError: (err) =>
      toast.error("Cập nhật thất bại", {
        description: err?.response?.data?.error || err.message,
      }),
  });
}

// ═══════════════════════════════════════════════════════════════
// ĐỔI TRẠNG THÁI
// ═══════════════════════════════════════════════════════════════
export function useChangeEmployeeStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, is_active }) => api.changeEmployeeStatus(id, is_active),
    onSuccess: (_, v) => {
      toast.success(v.is_active ? "Đã kích hoạt" : "Đã ngưng hoạt động");
      qc.invalidateQueries({ queryKey: ["employees"] });
    },
    onError: (err) =>
      toast.error("Đổi trạng thái thất bại", {
        description: err?.response?.data?.error || err.message,
      }),
  });
}

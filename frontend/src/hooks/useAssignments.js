import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import * as api from "@/api/assignmentsApi";

export function useAssignmentsList({
  date,
  from,
  to,
  employee_id,
  vehicle_id,
  route_id,
  shift_template_id,
  depot_id,
  status,
  page = 1,
  limit = 200,
  enabled = true,
} = {}) {
  return useQuery({
    queryKey: [
      "assignments",
      "list",
      {
        date,
        from,
        to,
        employee_id,
        vehicle_id,
        route_id,
        shift_template_id,
        depot_id,
        status,
        page,
        limit,
      },
    ],
    queryFn: () =>
      api.fetchAssignments({
        date,
        from,
        to,
        employee_id,
        vehicle_id,
        route_id,
        shift_template_id,
        depot_id,
        status,
        page,
        limit,
      }),
    enabled: !!date || !!from || !!employee_id || !!vehicle_id,
    staleTime: 30 * 1000,
  });
}

export function useAssignmentsByDate({ date, depot_id } = {}) {
  return useQuery({
    queryKey: ["assignments", "by-date", { date, depot_id }],
    queryFn: () => api.fetchAssignmentsByDate(date, { depot_id }),
    enabled: !!date,
    staleTime: 30 * 1000,
  });
}

export function useAssignmentStats({ date, depot_id } = {}) {
  return useQuery({
    queryKey: ["assignments", "stats", { date, depot_id }],
    queryFn: () => api.fetchAssignmentStats({ date, depot_id }),
    enabled: !!date,
    staleTime: 60 * 1000,
  });
}

export function useSuggestBlocks() {
  return useMutation({
    mutationFn: api.suggestBlocks,
    onError: (err) => {
      toast.error("Không thể phân tích", {
        description: err?.response?.data?.error || err.message,
        duration: 6000,
      });
    },
  });
}

export function useBulkCreateAssignments() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.bulkCreateAssignments,
    onSuccess: (data) => {
      toast.success(`Đã tạo ${data?.inserted || 0} phân công`);
      qc.invalidateQueries({ queryKey: ["assignments"] });
    },
    onError: (err) => {
      const payload = err?.response?.data;
      const msg = payload?.error || err.message;
      const errors = payload?.errors || [];
      toast.error("Tạo phân công thất bại", {
        description:
          errors.length > 0
            ? `${errors[0]}${errors.length > 1 ? ` (+${errors.length - 1} lỗi khác)` : ""}`
            : msg,
        duration: 8000,
      });
    },
  });
}

export function useCreateAssignment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.createAssignment,
    onSuccess: () => {
      toast.success("Đã tạo phân công");
      qc.invalidateQueries({ queryKey: ["assignments"] });
    },
    onError: (err) =>
      toast.error("Tạo thất bại", {
        description: err?.response?.data?.error || err.message,
      }),
  });
}

export function useUpdateAssignment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }) => api.updateAssignment(id, payload),
    onSuccess: () => {
      toast.success("Đã cập nhật phân công");
      qc.invalidateQueries({ queryKey: ["assignments"] });
    },
    onError: (err) =>
      toast.error("Cập nhật thất bại", {
        description: err?.response?.data?.error || err.message,
      }),
  });
}

export function useChangeAssignmentStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }) => api.changeAssignmentStatus(id, status),
    onSuccess: (_, v) => {
      toast.success(`Đã đổi trạng thái thành "${v.status}"`);
      qc.invalidateQueries({ queryKey: ["assignments"] });
    },
    onError: (err) =>
      toast.error("Đổi trạng thái thất bại", {
        description: err?.response?.data?.error || err.message,
      }),
  });
}

export function useDeleteAssignment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.deleteAssignment,
    onSuccess: () => {
      toast.success("Đã xóa phân công");
      qc.invalidateQueries({ queryKey: ["assignments"] });
    },
    onError: (err) =>
      toast.error("Xóa thất bại", {
        description: err?.response?.data?.error || err.message,
      }),
  });
}

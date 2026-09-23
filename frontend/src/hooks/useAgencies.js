import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import * as api from '@/api/agenciesApi';

export function useAgenciesList({ page = 1, limit = 20, is_active, q = '' } = {}) {
  return useQuery({
    queryKey: ['agencies', 'list', { page, limit, is_active, q }],
    queryFn: () => api.fetchAgencies({ page, limit, is_active, q }),
    placeholderData: (prev) => prev,
    staleTime: 30 * 1000,
  });
}

export function useAgencyStats() {
  return useQuery({
    queryKey: ['agencies', 'stats'],
    queryFn: api.fetchAgencyStats,
    staleTime: 60 * 1000,
  });
}

export function useCreateAgency() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.createAgency,
    onSuccess: () => {
      toast.success('Đã tạo agency');
      qc.invalidateQueries({ queryKey: ['agencies'] });
    },
    onError: (err) =>
      toast.error('Tạo thất bại', { description: err?.response?.data?.error || err.message }),
  });
}

export function useUpdateAgency() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }) => api.updateAgency(id, payload),
    onSuccess: () => {
      toast.success('Đã cập nhật agency');
      qc.invalidateQueries({ queryKey: ['agencies'] });
    },
    onError: (err) =>
      toast.error('Cập nhật thất bại', { description: err?.response?.data?.error || err.message }),
  });
}

export function useChangeAgencyStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, is_active }) => api.changeAgencyStatus(id, is_active),
    onSuccess: (_, v) => {
      toast.success(v.is_active ? 'Đã kích hoạt' : 'Đã ngưng');
      qc.invalidateQueries({ queryKey: ['agencies'] });
    },
    onError: (err) =>
      toast.error('Đổi trạng thái thất bại', { description: err?.response?.data?.error || err.message }),
  });
}

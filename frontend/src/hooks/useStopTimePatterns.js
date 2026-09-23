import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { toast } from 'sonner';
import * as api from '@/api/stopTimePatternsApi';

export function useStopTimesList({ page = 1, limit = 50, trip_pattern_id, stop_id } = {}) {
  return useQuery({
    queryKey: ['stop-times', 'list', { page, limit, trip_pattern_id, stop_id }],
    queryFn: () => api.fetchStopTimes({ page, limit, trip_pattern_id, stop_id }),
    placeholderData: keepPreviousData,
    enabled: trip_pattern_id !== undefined ? !!trip_pattern_id : true,
  });
}

export function useStopTimeStats() {
  return useQuery({
    queryKey: ['stop-times', 'stats'],
    queryFn: api.fetchStopTimeStats,
    staleTime: 60 * 1000,
  });
}

export function useCreateStopTime() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.createStopTime,
    onSuccess: () => {
      toast.success('Đã thêm lịch trình');
      qc.invalidateQueries({ queryKey: ['stop-times'] });
      qc.invalidateQueries({ queryKey: ['patterns'] });
    },
    onError: (err) =>
      toast.error('Thêm thất bại', {
        description: err?.response?.data?.error || err.message,
      }),
  });
}

export function useUpdateStopTime() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }) => api.updateStopTime(id, payload),
    onSuccess: () => {
      toast.success('Đã cập nhật');
      qc.invalidateQueries({ queryKey: ['stop-times'] });
      qc.invalidateQueries({ queryKey: ['patterns'] });
    },
    onError: (err) =>
      toast.error('Cập nhật thất bại', {
        description: err?.response?.data?.error || err.message,
      }),
  });
}

export function useDeleteStopTime() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.deleteStopTime,
    onSuccess: () => {
      toast.success('Đã xoá');
      qc.invalidateQueries({ queryKey: ['stop-times'] });
      qc.invalidateQueries({ queryKey: ['patterns'] });
    },
    onError: (err) =>
      toast.error('Xoá thất bại', {
        description: err?.response?.data?.error || err.message,
      }),
  });
}

import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { toast } from 'sonner';
import * as api from '@/api/tripPatternsApi';

export function usePatternsList({ page = 1, limit = 20, route_id, direction_id, q = '' } = {}) {
  return useQuery({
    queryKey: ['patterns', 'list', { page, limit, route_id, direction_id, q }],
    queryFn: () => api.fetchPatterns({ page, limit, route_id, direction_id, q }),
    placeholderData: keepPreviousData,
    staleTime: 30 * 1000,
  });
}

export function usePatternStats() {
  return useQuery({
    queryKey: ['patterns', 'stats'],
    queryFn: api.fetchPatternStats,
    staleTime: 60 * 1000,
  });
}

export function usePatternDetail(id, { enabled = true } = {}) {
  return useQuery({
    queryKey: ['patterns', 'detail', id],
    queryFn: () => api.fetchPatternDetail(id),
    enabled: !!id && enabled,
  });
}

export function usePatternsByRoute(routeId, { enabled = true } = {}) {
  return useQuery({
    queryKey: ['patterns', 'by-route', routeId],
    queryFn: () => api.fetchPatternsByRoute(routeId),
    enabled: !!routeId && enabled,
    staleTime: 60 * 1000,
  });
}

export function useCreatePattern() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.createPattern,
    onSuccess: () => {
      toast.success('Đã tạo pattern');
      qc.invalidateQueries({ queryKey: ['patterns'] });
    },
    onError: (err) =>
      toast.error('Tạo thất bại', { description: err?.response?.data?.error || err.message }),
  });
}

export function useUpdatePattern() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }) => api.updatePattern(id, payload),
    onSuccess: () => {
      toast.success('Đã cập nhật pattern');
      qc.invalidateQueries({ queryKey: ['patterns'] });
    },
    onError: (err) =>
      toast.error('Cập nhật thất bại', { description: err?.response?.data?.error || err.message }),
  });
}

export function useDeletePattern() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, cascade = true }) => api.deletePattern(id, { cascade }),
    onSuccess: () => {
      toast.success('Đã xoá pattern');
      qc.invalidateQueries({ queryKey: ['patterns'] });
    },
    onError: (err) =>
      toast.error('Xoá thất bại', { description: err?.response?.data?.error || err.message }),
  });
}

// ─── Stop times ───
export function usePatternStopTimes(patternId, { enabled = true } = {}) {
  return useQuery({
    queryKey: ['patterns', 'stop-times', patternId],
    queryFn: () => api.fetchPatternStopTimes(patternId),
    enabled: !!patternId && enabled,
  });
}

export function useReplacePatternStopTimes() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ patternId, stops }) => api.replacePatternStopTimes(patternId, stops),
    onSuccess: (_, vars) => {
      toast.success('Đã cập nhật danh sách trạm');
      qc.invalidateQueries({ queryKey: ['patterns', 'stop-times', vars.patternId] });
      qc.invalidateQueries({ queryKey: ['patterns'] });
    },
    onError: (err) =>
      toast.error('Cập nhật thất bại', { description: err?.response?.data?.error || err.message }),
  });
}

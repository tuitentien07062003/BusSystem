import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { toast } from 'sonner';
import * as api from '@/api/routesApi';

export function useRoutesList({ page = 1, limit = 20, is_active, q = '' } = {}) {
  return useQuery({
    queryKey: ['routes', 'list', { page, limit, is_active, q }],
    queryFn: () => api.fetchRoutes({ page, limit, is_active, q }),
    placeholderData: (prev) => prev,
    staleTime: 30 * 1000,
  });
}

export function useRouteStats() {
  return useQuery({
    queryKey: ['routes', 'stats'],
    queryFn: api.fetchRouteStats,
    staleTime: 60 * 1000,
  });
}

export function useFullRoute(id, { enabled = true } = {}) {
  return useQuery({
    queryKey: ['routes', 'full', id],
    queryFn: () => api.fetchFullRoute(id),
    enabled: !!id && enabled,
    staleTime: 60 * 1000,
  });
}

export function useUpdateRoute() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }) => api.updateRoute(id, payload),
    onSuccess: () => {
      toast.success('Đã cập nhật tuyến');
      qc.invalidateQueries({ queryKey: ['routes'] });
    },
    onError: (err) => toast.error('Cập nhật thất bại', { description: err?.response?.data?.error || err.message }),
  });
}

export function useChangeRouteStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, is_active }) => api.changeRouteStatus(id, is_active),
    onSuccess: (_, v) => {
      toast.success(v.is_active ? 'Đã kích hoạt' : 'Đã ngưng');
      qc.invalidateQueries({ queryKey: ['routes'] });
    },
    onError: (err) => toast.error('Đổi trạng thái thất bại', { description: err?.response?.data?.error || err.message }),
  });
}

export function useDeleteComposedRoute() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.deleteComposedRoute,
    onSuccess: () => {
      toast.success('Đã xóa tuyến');
      qc.invalidateQueries({ queryKey: ['routes'] });
    },
    onError: (err) => toast.error('Xóa thất bại', { description: err?.response?.data?.error || err.message }),
  });
}

export function useDepotsForComposer() {
  return useQuery({
    queryKey: ['routes', 'composer', 'depots'],
    queryFn: api.fetchDepotsForComposer,
    staleTime: 5 * 60 * 1000,
  });
}

export function useSearchStopsForComposer(keyword, limit = 50, enabled = true) {
  return useQuery({
    queryKey: ['routes', 'composer', 'stops-search', keyword, limit],
    queryFn: () => api.searchStopsForComposer({ q: keyword, limit }),
    staleTime: 60 * 1000,
    placeholderData: keepPreviousData,
    enabled,
  });
}

export function usePreviewRoute() {
  return useMutation({ mutationFn: api.previewRoute });
}

export function useSaveComposedRoute() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.saveComposedRoute,
    onSuccess: () => {
      toast.success('Đã tạo tuyến mới');
      qc.invalidateQueries({ queryKey: ['routes'] });
    },
    onError: (err) => toast.error('Tạo tuyến thất bại', { description: err?.response?.data?.error || err.message }),
  });
}

export function useMatchStops() {
  return useMutation({ mutationFn: api.matchStops });
}

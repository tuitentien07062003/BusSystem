import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import * as stopsApi from '@/api/stopsApi';

/**
 * Lấy danh sách stops — tự chọn endpoint search nếu có keyword
 * @param {number} [stop_type] - 0 = trạm dừng, 1 = depot, undefined = tất cả
 */
export function useStopsList({
  page = 1,
  limit = 20,
  is_active,
  stop_type,
  keyword = '',
} = {}) {
  return useQuery({
    queryKey: ['stops', 'list', { page, limit, is_active, stop_type, keyword }],
    queryFn: () => {
      const params = { page, limit, is_active, stop_type };
      return keyword.trim()
        ? stopsApi.searchStops({ ...params, q: keyword.trim() })
        : stopsApi.fetchStops(params);
    },
    placeholderData: (prev) => prev,
    staleTime: 30 * 1000,
  });
}

/**
 * Thống kê — có thể truyền stop_type để đếm riêng
 */
export function useStopStats(stop_type) {
  return useQuery({
    queryKey: ['stops', 'stats', stop_type ?? 'all'],
    queryFn: () => stopsApi.fetchStopStats(stop_type),
    staleTime: 60 * 1000,
  });
}

export function useUpdateStop() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }) => stopsApi.updateStop(id, payload),
    onSuccess: () => {
      toast.success('Đã cập nhật thông tin');
      qc.invalidateQueries({ queryKey: ['stops'] });
    },
    onError: (err) => {
      toast.error('Cập nhật thất bại', {
        description: err?.response?.data?.error || err.message,
      });
    },
  });
}

export function useChangeStopStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, is_active }) => stopsApi.changeStopStatus(id, is_active),
    onSuccess: (_, vars) => {
      toast.success(vars.is_active ? 'Đã kích hoạt' : 'Đã ngưng hoạt động');
      qc.invalidateQueries({ queryKey: ['stops'] });
    },
    onError: (err) => {
      toast.error('Đổi trạng thái thất bại', {
        description: err?.response?.data?.error || err.message,
      });
    },
  });
}

// ── Road Override ──
export function useNearbyRoads(stopId, radiusM = 300, enabled = true) {
  return useQuery({
    queryKey: ['stops', 'nearby-roads', stopId, radiusM],
    queryFn: () => stopsApi.getNearbyRoads(stopId, radiusM),
    enabled: !!stopId && enabled,
    staleTime: 60 * 1000,
  });
}

export function useSetStopOverride() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ stopId, roadId, note }) => stopsApi.setStopOverride(stopId, roadId, note),
    onSuccess: (_, vars) => {
      toast.success('Đã lưu đường override');
      qc.invalidateQueries({ queryKey: ['stops', 'override', vars.stopId] });
    },
    onError: (err) =>
      toast.error('Lưu thất bại', { description: err?.response?.data?.error || err.message }),
  });
}

export function useRemoveStopOverride() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (stopId) => stopsApi.removeStopOverride(stopId),
    onSuccess: (_, stopId) => {
      toast.success('Đã xoá override');
      qc.invalidateQueries({ queryKey: ['stops', 'override', stopId] });
    },
    onError: (err) =>
      toast.error('Xoá thất bại', { description: err?.response?.data?.error || err.message }),
  });
}

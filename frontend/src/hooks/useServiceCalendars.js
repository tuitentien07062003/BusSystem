import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import * as api from '@/api/serviceCalendarsApi';

export function useCalendarsList({ page = 1, limit = 20, q = '' } = {}) {
  return useQuery({
    queryKey: ['calendars', 'list', { page, limit, q }],
    queryFn: () => api.fetchCalendars({ page, limit, q }),
    placeholderData: (prev) => prev,
  });
}

export function useCreateCalendar() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.createCalendar,
    onSuccess: () => {
      toast.success('Đã tạo lịch');
      qc.invalidateQueries({ queryKey: ['calendars'] });
    },
    onError: (err) =>
      toast.error('Tạo thất bại', { description: err?.response?.data?.error || err.message }),
  });
}

export function useUpdateCalendar() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }) => api.updateCalendar(id, payload),
    onSuccess: () => {
      toast.success('Đã cập nhật');
      qc.invalidateQueries({ queryKey: ['calendars'] });
    },
    onError: (err) =>
      toast.error('Cập nhật thất bại', { description: err?.response?.data?.error || err.message }),
  });
}

export function useDeleteCalendar() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.deleteCalendar,
    onSuccess: () => {
      toast.success('Đã xóa');
      qc.invalidateQueries({ queryKey: ['calendars'] });
    },
    onError: (err) =>
      toast.error('Xóa thất bại', { description: err?.response?.data?.error || err.message }),
  });
}

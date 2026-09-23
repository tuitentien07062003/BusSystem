import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useCreateCalendar, useUpdateCalendar } from '@/hooks/useServiceCalendars';

const DAYS = [
  { key: 'monday', label: 'T2' },
  { key: 'tuesday', label: 'T3' },
  { key: 'wednesday', label: 'T4' },
  { key: 'thursday', label: 'T5' },
  { key: 'friday', label: 'T6' },
  { key: 'saturday', label: 'T7' },
  { key: 'sunday', label: 'CN' },
];

const schema = z.object({
  service_id: z.string().trim().min(1, 'Mã lịch không được để trống'),
  start_date: z.string().min(1, 'Ngày bắt đầu bắt buộc'),
  end_date: z.string().min(1, 'Ngày kết thúc bắt buộc'),
  monday: z.boolean(), tuesday: z.boolean(), wednesday: z.boolean(),
  thursday: z.boolean(), friday: z.boolean(), saturday: z.boolean(), sunday: z.boolean(),
}).refine((d) => new Date(d.end_date) >= new Date(d.start_date), {
  message: 'Ngày kết thúc phải sau ngày bắt đầu',
  path: ['end_date'],
});

export function CalendarFormDialog({ calendar, open, onOpenChange }) {
  const isEdit = !!calendar;
  const createMut = useCreateCalendar();
  const updateMut = useUpdateCalendar();

  const { register, handleSubmit, reset, watch, setValue, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      service_id: '',
      start_date: '',
      end_date: '',
      monday: true, tuesday: true, wednesday: true, thursday: true, friday: true, saturday: false, sunday: false,
    },
  });

  useEffect(() => {
    if (open) {
      reset(
        calendar
          ? {
              service_id: calendar.service_id || '',
              start_date: calendar.start_date || '',
              end_date: calendar.end_date || '',
              monday: !!calendar.monday, tuesday: !!calendar.tuesday, wednesday: !!calendar.wednesday,
              thursday: !!calendar.thursday, friday: !!calendar.friday,
              saturday: !!calendar.saturday, sunday: !!calendar.sunday,
            }
          : {
              service_id: '', start_date: '', end_date: '',
              monday: true, tuesday: true, wednesday: true, thursday: true, friday: true, saturday: false, sunday: false,
            }
      );
    }
  }, [open, calendar, reset]);

  const onSubmit = async (values) => {
    if (isEdit) await updateMut.mutateAsync({ id: calendar.id, payload: values });
    else await createMut.mutateAsync(values);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? `Sửa lịch #${calendar.id}` : 'Thêm lịch phục vụ'}</DialogTitle>
          <DialogDescription>Chọn các ngày trong tuần và khoảng thời gian áp dụng.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="px-5 py-4 space-y-3">
          <div className="space-y-1">
            <Label>Mã lịch *</Label>
            <Input {...register('service_id')} placeholder="VD: WEEKDAY" disabled={isEdit} />
            {errors.service_id && <p className="text-[11px] text-[#c0392b]">{errors.service_id.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Ngày bắt đầu *</Label>
              <Input type="date" {...register('start_date')} />
              {errors.start_date && <p className="text-[11px] text-[#c0392b]">{errors.start_date.message}</p>}
            </div>
            <div className="space-y-1">
              <Label>Ngày kết thúc *</Label>
              <Input type="date" {...register('end_date')} />
              {errors.end_date && <p className="text-[11px] text-[#c0392b]">{errors.end_date.message}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Ngày chạy trong tuần</Label>
            <div className="flex flex-wrap gap-2">
              {DAYS.map((d) => {
                const checked = watch(d.key);
                return (
                  <button
                    key={d.key}
                    type="button"
                    onClick={() => setValue(d.key, !checked)}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold border transition-colors cursor-pointer ${
                      checked
                        ? 'bg-[#1a5a8a] text-white border-[#1a5a8a]'
                        : 'bg-white text-[#6a7a9a] border-[#cbd5e1] hover:border-[#5fc3e4]'
                    }`}
                  >
                    {d.label}
                  </button>
                );
              })}
            </div>
          </div>

          <DialogFooter className="-mx-5 -mb-4">
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)} disabled={isSubmitting}>Hủy</Button>
            <Button type="submit" variant="primary" disabled={isSubmitting}>
              {isSubmitting ? 'Đang lưu...' : isEdit ? 'Lưu thay đổi' : 'Tạo mới'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

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
import { Switch } from '@/components/ui/switch';
import { useCreateTrip, useUpdateTrip } from '@/hooks/useTrips';

const schema = z.object({
  trip_id: z.string().trim().min(1, 'Mã chuyến không được để trống'),
  trip_pattern_id: z.coerce.number().int().optional().nullable(),
  service_id: z.coerce.number().int().optional().nullable(),
  start_time: z.string().min(1, 'Giờ xuất bến bắt buộc'),
  is_active: z.boolean(),
});

export function TripFormDialog({ trip, open, onOpenChange }) {
  const isEdit = !!trip;
  const createMut = useCreateTrip();
  const updateMut = useUpdateTrip();

  const { register, handleSubmit, reset, watch, setValue, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      trip_id: '', trip_pattern_id: null, service_id: null, start_time: '06:00:00', is_active: true,
    },
  });

  useEffect(() => {
    if (open) {
      reset(
        trip
          ? {
              trip_id: trip.trip_id || '',
              trip_pattern_id: trip.trip_pattern_id ?? null,
              service_id: trip.service_id ?? null,
              start_time: trip.start_time || '06:00:00',
              is_active: trip.is_active ?? true,
            }
          : {
              trip_id: '', trip_pattern_id: null, service_id: null, start_time: '06:00:00', is_active: true,
            }
      );
    }
  }, [open, trip, reset]);

  const isActive = watch('is_active');

  const onSubmit = async (values) => {
    const payload = {
      ...values,
      trip_pattern_id: values.trip_pattern_id || null,
      service_id: values.service_id || null,
    };
    if (isEdit) await updateMut.mutateAsync({ id: trip.id, payload });
    else await createMut.mutateAsync(payload);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? `Sửa chuyến #${trip.id}` : 'Thêm chuyến xe'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="px-5 py-4 space-y-3">
          <div className="space-y-1">
            <Label>Mã chuyến *</Label>
            <Input {...register('trip_id')} placeholder="VD: T_19_GO_01" disabled={isEdit} />
            {errors.trip_id && <p className="text-[11px] text-[#c0392b]">{errors.trip_id.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Pattern ID</Label>
              <Input type="number" {...register('trip_pattern_id')} placeholder="—" />
            </div>
            <div className="space-y-1">
              <Label>Service ID</Label>
              <Input type="number" {...register('service_id')} placeholder="—" />
            </div>
          </div>

          <div className="space-y-1">
            <Label>Giờ xuất bến * (HH:MM:SS)</Label>
            <Input {...register('start_time')} placeholder="06:00:00" />
            {errors.start_time && <p className="text-[11px] text-[#c0392b]">{errors.start_time.message}</p>}
          </div>

          <div className="flex items-center justify-between py-1">
            <Label>Đang hoạt động</Label>
            <Switch checked={isActive} onCheckedChange={(v) => setValue('is_active', v)} />
          </div>

          <DialogFooter className="-mx-5 -mb-4">
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)} disabled={isSubmitting}>Hủy</Button>
            <Button type="submit" variant="primary" disabled={isSubmitting}>
              {isSubmitting ? 'Đang lưu...' : isEdit ? 'Lưu' : 'Tạo mới'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

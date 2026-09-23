import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useUpdateStop } from '@/hooks/useStops';
import { LocationPicker } from './LocationPicker';

// Danh mục loại trạm
const STOP_TYPES = [
  { value: 0, label: 'Trạm dừng', color: 'muted' },
  { value: 1, label: 'Depot', color: 'warning' },
];

const schema = z.object({
  stop_id: z.string().trim().min(1, 'Mã không được để trống'),
  stop_name: z.string().trim().min(1, 'Tên không được để trống'),
  stop_type: z.coerce.number().int().min(0, 'Loại không hợp lệ').max(10, 'Loại không hợp lệ'),
  latitude: z.coerce
    .number()
    .min(-90, 'Vĩ độ phải từ -90 đến 90')
    .max(90, 'Vĩ độ phải từ -90 đến 90'),
  longitude: z.coerce
    .number()
    .min(-180, 'Kinh độ phải từ -180 đến 180')
    .max(180, 'Kinh độ phải từ -180 đến 180'),
});

export function StopEditDialog({ stop, open, onOpenChange }) {
  const updateMutation = useUpdateStop();
  const [showMap, setShowMap] = useState(true);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    control,
    formState: { errors, isSubmitting, isDirty },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      stop_id: '',
      stop_name: '',
      stop_type: 0,
      latitude: 0,
      longitude: 0,
    },
  });

  const lat = watch('latitude');
  const lng = watch('longitude');
  const currentType = watch('stop_type');

  useEffect(() => {
    if (open && stop) {
      reset({
        stop_id: stop.stop_id || '',
        stop_name: stop.stop_name || '',
        stop_type: stop.stop_type ?? 0,
        latitude: stop.latitude ?? 0,
        longitude: stop.longitude ?? 0,
      });
      setShowMap(true);
    }
  }, [open, stop, reset]);

  const handleMapChange = (newLat, newLng) => {
    setValue('latitude', Number(newLat.toFixed(6)), { shouldDirty: true });
    setValue('longitude', Number(newLng.toFixed(6)), { shouldDirty: true });
  };

  const onSubmit = async (values) => {
    if (!stop) return;
    await updateMutation.mutateAsync({ id: stop.id, payload: values });
    onOpenChange(false);
  };

  const handleClose = (nextOpen) => {
    if (!nextOpen && isDirty) {
      if (!confirm('Bạn có thay đổi chưa lưu. Đóng dialog?')) return;
    }
    onOpenChange(nextOpen);
  };

  const typeMeta = STOP_TYPES.find((t) => t.value === currentType) || STOP_TYPES[0];

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 flex-wrap">
            Chỉnh sửa
            <Badge variant="info">#{stop?.id}</Badge>
            <Badge variant={typeMeta.color}>{typeMeta.label}</Badge>
            {stop?.is_active ? (
              <Badge variant="success">Hoạt động</Badge>
            ) : (
              <Badge variant="danger">Ngưng</Badge>
            )}
          </DialogTitle>
          <DialogDescription>
            Cập nhật thông tin. Trường có dấu <b>*</b> là bắt buộc.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="px-5 py-4 space-y-4">
          {/* Hàng 1: Mã + Loại (dropdown) */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Mã *</Label>
              <Input {...register('stop_id')} placeholder="VD: S001" />
              {errors.stop_id && (
                <p className="text-[11px] text-[#c0392b]">{errors.stop_id.message}</p>
              )}
            </div>

            <div className="space-y-1">
              <Label>Loại *</Label>
              <Controller
                name="stop_type"
                control={control}
                render={({ field }) => (
                  <Select
                    value={String(field.value ?? 0)}
                    onValueChange={(v) => field.onChange(Number(v))}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Chọn loại" />
                    </SelectTrigger>
                    <SelectContent>
                      {STOP_TYPES.map((t) => (
                        <SelectItem key={t.value} value={String(t.value)}>
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.stop_type && (
                <p className="text-[11px] text-[#c0392b]">{errors.stop_type.message}</p>
              )}
            </div>
          </div>

          {/* Tên */}
          <div className="space-y-1">
            <Label>Tên *</Label>
            <Input {...register('stop_name')} placeholder="VD: Bến Thành" />
            {errors.stop_name && (
              <p className="text-[11px] text-[#c0392b]">{errors.stop_name.message}</p>
            )}
          </div>

          {/* Toạ độ */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Vĩ độ (latitude) *</Label>
              <Input type="number" step="any" {...register('latitude')} />
              {errors.latitude && (
                <p className="text-[11px] text-[#c0392b]">{errors.latitude.message}</p>
              )}
            </div>

            <div className="space-y-1">
              <Label>Kinh độ (longitude) *</Label>
              <Input type="number" step="any" {...register('longitude')} />
              {errors.longitude && (
                <p className="text-[11px] text-[#c0392b]">{errors.longitude.message}</p>
              )}
            </div>
          </div>

          {/* Vị trí trên bản đồ */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2">
              <Label>Vị trí trên bản đồ</Label>
              <Badge variant="muted">
                {Number(lat).toFixed(5)}, {Number(lng).toFixed(5)}
              </Badge>
            </div>
            <button
              type="button"
              onClick={() => setShowMap((v) => !v)}
              className="text-[11px] font-semibold text-[#1a5a8a] hover:text-[#0d3d6a] cursor-pointer"
            >
              {showMap ? 'Ẩn bản đồ' : 'Hiện bản đồ'}
            </button>
          </div>

          {showMap && (
            <LocationPicker
              latitude={lat}
              longitude={lng}
              onChange={handleMapChange}
            />
          )}

          <DialogFooter className="-mx-5 -mb-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => handleClose(false)}
              disabled={isSubmitting}
            >
              Hủy
            </Button>
            <Button type="submit" variant="primary" disabled={isSubmitting}>
              {isSubmitting ? 'Đang lưu...' : 'Lưu thay đổi'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

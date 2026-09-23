import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useCreateAgency, useUpdateAgency } from '@/hooks/useAgencies';

const schema = z.object({
  agency_id: z.string().trim().min(1, 'Mã không được để trống'),
  agency_name: z.string().trim().min(1, 'Tên không được để trống'),
  agency_url: z
    .string()
    .trim()
    .optional()
    .refine((v) => !v || /^https?:\/\//i.test(v), 'URL phải bắt đầu bằng http:// hoặc https://'),
  agency_timezone: z.string().trim().optional(),
  is_active: z.boolean(),
});

export function AgencyFormDialog({ agency, open, onOpenChange }) {
  const isEdit = !!agency;
  const createMut = useCreateAgency();
  const updateMut = useUpdateAgency();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      agency_id: '',
      agency_name: '',
      agency_url: '',
      agency_timezone: 'Asia/Ho_Chi_Minh',
      is_active: true,
    },
  });

  useEffect(() => {
    if (open) {
      reset(
        agency
          ? {
              agency_id: agency.agency_id || '',
              agency_name: agency.agency_name || '',
              agency_url: agency.agency_url || '',
              agency_timezone: agency.agency_timezone || '',
              is_active: agency.is_active ?? true,
            }
          : {
              agency_id: '',
              agency_name: '',
              agency_url: '',
              agency_timezone: 'Asia/Ho_Chi_Minh',
              is_active: true,
            }
      );
    }
  }, [open, agency, reset]);

  const isActive = watch('is_active');

  const onSubmit = async (values) => {
    const payload = {
      ...values,
      agency_url: values.agency_url || null,
      agency_timezone: values.agency_timezone || null,
    };
    if (isEdit) await updateMut.mutateAsync({ id: agency.id, payload });
    else await createMut.mutateAsync(payload);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? `Sửa agency #${agency.id}` : 'Thêm nhà vận hành'}</DialogTitle>
          <DialogDescription>Trường có dấu * là bắt buộc.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="px-5 py-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Mã agency *</Label>
              <Input {...register('agency_id')} placeholder="TBUS" />
              {errors.agency_id && <p className="text-[11px] text-[#c0392b]">{errors.agency_id.message}</p>}
            </div>
            <div className="space-y-1">
              <Label>Tên *</Label>
              <Input {...register('agency_name')} placeholder="TBus Vietnam" />
              {errors.agency_name && <p className="text-[11px] text-[#c0392b]">{errors.agency_name.message}</p>}
            </div>
          </div>

          <div className="space-y-1">
            <Label>Website</Label>
            <Input {...register('agency_url')} placeholder="https://tbus.vn" />
            {errors.agency_url && <p className="text-[11px] text-[#c0392b]">{errors.agency_url.message}</p>}
          </div>

          <div className="space-y-1">
            <Label>Múi giờ</Label>
            <Input {...register('agency_timezone')} placeholder="Asia/Ho_Chi_Minh" />
          </div>

          <div className="flex items-center justify-between py-2">
            <Label>Đang hoạt động</Label>
            <Switch checked={isActive} onCheckedChange={(v) => setValue('is_active', v)} />
          </div>

          <DialogFooter className="-mx-5 -mb-4">
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Hủy
            </Button>
            <Button type="submit" variant="primary" disabled={isSubmitting}>
              {isSubmitting ? 'Đang lưu...' : isEdit ? 'Lưu thay đổi' : 'Tạo mới'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

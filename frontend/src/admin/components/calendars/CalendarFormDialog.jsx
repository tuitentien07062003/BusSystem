import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  useCreateCalendar,
  useUpdateCalendar,
} from "@/hooks/useServiceCalendars";

const DAYS = [
  { key: "monday", label: "T2" },
  { key: "tuesday", label: "T3" },
  { key: "wednesday", label: "T4" },
  { key: "thursday", label: "T5" },
  { key: "friday", label: "T6" },
  { key: "saturday", label: "T7" },
  { key: "sunday", label: "CN" },
];

// ═══════════════════════════════════════════════════════════════
// Schema — thêm headway_multiplier
// ═══════════════════════════════════════════════════════════════
const schema = z
  .object({
    service_id: z.string().trim().min(1, "Mã lịch không được để trống"),
    start_date: z.string().min(1, "Ngày bắt đầu bắt buộc"),
    end_date: z.string().min(1, "Ngày kết thúc bắt buộc"),
    monday: z.boolean(),
    tuesday: z.boolean(),
    wednesday: z.boolean(),
    thursday: z.boolean(),
    friday: z.boolean(),
    saturday: z.boolean(),
    sunday: z.boolean(),

    // ─── MỚI ───
    headway_multiplier: z.coerce
      .number()
      .min(0.1, "Hệ số tối thiểu 0.1")
      .max(5.0, "Hệ số tối đa 5.0"),
  })
  .refine((d) => new Date(d.end_date) >= new Date(d.start_date), {
    message: "Ngày kết thúc phải sau ngày bắt đầu",
    path: ["end_date"],
  });

export function CalendarFormDialog({ calendar, open, onOpenChange }) {
  const isEdit = !!calendar;
  const createMut = useCreateCalendar();
  const updateMut = useUpdateCalendar();

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
      service_id: "",
      start_date: "",
      end_date: "",
      monday: true,
      tuesday: true,
      wednesday: true,
      thursday: true,
      friday: true,
      saturday: false,
      sunday: false,
      headway_multiplier: 1.0, // ← MỚI
    },
  });

  useEffect(() => {
    if (open) {
      reset(
        calendar
          ? {
              service_id: calendar.service_id || "",
              start_date: calendar.start_date || "",
              end_date: calendar.end_date || "",
              monday: !!calendar.monday,
              tuesday: !!calendar.tuesday,
              wednesday: !!calendar.wednesday,
              thursday: !!calendar.thursday,
              friday: !!calendar.friday,
              saturday: !!calendar.saturday,
              sunday: !!calendar.sunday,
              headway_multiplier: calendar.headway_multiplier ?? 1.0, // ← MỚI
            }
          : {
              service_id: "",
              start_date: "",
              end_date: "",
              monday: true,
              tuesday: true,
              wednesday: true,
              thursday: true,
              friday: true,
              saturday: false,
              sunday: false,
              headway_multiplier: 1.0, // ← MỚI
            },
      );
    }
  }, [open, calendar, reset]);

  const onSubmit = async (values) => {
    if (isEdit)
      await updateMut.mutateAsync({ id: calendar.id, payload: values });
    else await createMut.mutateAsync(values);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? `Sửa lịch #${calendar.id}` : "Thêm lịch phục vụ"}
          </DialogTitle>
          <DialogDescription>
            Chọn các ngày trong tuần và khoảng thời gian áp dụng.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="px-5 py-4 space-y-3">
          <div className="space-y-1">
            <Label>Mã lịch *</Label>
            <Input
              {...register("service_id")}
              placeholder="VD: WEEKDAY"
              disabled={isEdit}
            />
            {errors.service_id && (
              <p className="text-[11px] text-[#c0392b]">
                {errors.service_id.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Ngày bắt đầu *</Label>
              <Input type="date" {...register("start_date")} />
              {errors.start_date && (
                <p className="text-[11px] text-[#c0392b]">
                  {errors.start_date.message}
                </p>
              )}
            </div>
            <div className="space-y-1">
              <Label>Ngày kết thúc *</Label>
              <Input type="date" {...register("end_date")} />
              {errors.end_date && (
                <p className="text-[11px] text-[#c0392b]">
                  {errors.end_date.message}
                </p>
              )}
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
                        ? "bg-[#169BA2] text-white border-[#169BA2]"
                        : "bg-white text-[#6a7a9a] border-[#cbd5e1] hover:border-[#169BA2]"
                    }`}
                  >
                    {d.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ═══════════ HỆ SỐ GIÃN CÁCH — MỚI ═══════════ */}
          <div className="space-y-2 pt-4 border-t border-[#e5eaf0]">
            <Label className="flex items-center gap-1.5">
              Hệ số giãn cách
              <span className="text-[10px] text-[#8a9aaa] font-normal">
                (nhân vào base headway)
              </span>
            </Label>

            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Input
                  type="number"
                  step="0.1"
                  min="0.1"
                  max="5.0"
                  {...register("headway_multiplier")}
                  className="pr-14 font-mono font-semibold"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#8a9aaa] pointer-events-none">
                  lần
                </span>
              </div>

              {/* Quick presets */}
              <div className="flex gap-1">
                {[
                  { v: 0.8, l: "0.8" },
                  { v: 1.0, l: "1.0" },
                  { v: 1.2, l: "1.2" },
                  { v: 1.5, l: "1.5" },
                ].map((p) => (
                  <button
                    key={p.v}
                    type="button"
                    onClick={() =>
                      setValue("headway_multiplier", p.v, { shouldDirty: true })
                    }
                    className="px-2 py-1 rounded text-[10px] font-semibold bg-[#f8fafc] border border-[#e5eaf0] hover:bg-[#e6f4f5] hover:border-[#a8d5d8] cursor-pointer transition-colors"
                  >
                    {p.l}
                  </button>
                ))}
              </div>
            </div>

            <p className="text-[10px] text-[#8a9aaa] leading-relaxed">
              <b>1.0</b> = bình thường, <b>1.2</b> = giãn 20% (ít chuyến hơn),
              <b> 0.8</b> = dày 20% (nhiều chuyến hơn).
            </p>

            {errors.headway_multiplier && (
              <p className="text-[11px] text-[#c0392b]">
                {errors.headway_multiplier.message}
              </p>
            )}
          </div>

          <DialogFooter className="-mx-5 -mb-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Hủy
            </Button>
            <Button type="submit" variant="primary" disabled={isSubmitting}>
              {isSubmitting
                ? "Đang lưu..."
                : isEdit
                  ? "Lưu thay đổi"
                  : "Tạo mới"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

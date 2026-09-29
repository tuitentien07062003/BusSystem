import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Loader2,
  Play,
  Info,
  Clock,
  DollarSign,
  Timer,
  FileText,
  Settings2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useActivateRoute } from "@/hooks/useRouteOperations";
import { HeadwayConfigEditor } from "./HeadwayConfigEditor";

// ═══════════════════════════════════════════════════════════════
// Schema validation
// ═══════════════════════════════════════════════════════════════
const schema = z
  .object({
    description: z
      .string()
      .trim()
      .max(500, "Mô tả tối đa 500 ký tự")
      .optional(),
    operating_start_time: z
      .string()
      .regex(/^\d{1,2}:\d{2}$/, "Định dạng HH:MM"),
    operating_end_time: z.string().regex(/^\d{1,2}:\d{2}$/, "Định dạng HH:MM"),
    base_fare: z.coerce
      .number()
      .int("Giá vé phải là số nguyên")
      .min(0, "Giá vé >= 0"),
    min_headway_minutes: z.coerce
      .number()
      .int()
      .min(1, "Giãn cách tối thiểu 1 phút")
      .max(180, "Giãn cách tối đa 180 phút"),
    max_headway_minutes: z.coerce
      .number()
      .int()
      .min(1, "Giãn cách tối thiểu 1 phút")
      .max(180, "Giãn cách tối đa 180 phút"),
  })
  .refine((d) => d.operating_start_time < d.operating_end_time, {
    message: "Giờ mở phải nhỏ hơn giờ đóng",
    path: ["operating_end_time"],
  })
  .refine((d) => d.min_headway_minutes <= d.max_headway_minutes, {
    message: "Giãn cách min phải <= giãn cách max",
    path: ["max_headway_minutes"],
  });

// ═══════════════════════════════════════════════════════════════
// Sub-component: field wrapper
// ═══════════════════════════════════════════════════════════════
function Field({ icon: Icon, label, required, error, children, hint }) {
  return (
    <div className="space-y-1.5">
      <Label className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-[#8A9AAA]">
        {Icon && <Icon size={11} />}
        {label}
        {required && <span className="text-rose-500">*</span>}
      </Label>
      {children}
      {hint && !error && <p className="text-[11px] text-[#8A9AAA]">{hint}</p>}
      {error && <p className="text-[11px] text-rose-600">{error}</p>}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════
export function RouteOperationForm({ routeId, onSuccess }) {
  const activateMut = useActivateRoute();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      description: "",
      operating_start_time: "05:00",
      operating_end_time: "22:00",
      base_fare: 7000,
      min_headway_minutes: 15,
      max_headway_minutes: 30,
    },
  });

  const onSubmit = async (values) => {
    const payload = {
      description: values.description || null,
      operating_start_time: values.operating_start_time,
      operating_end_time: values.operating_end_time,
      base_fare: values.base_fare,
      min_headway_seconds: values.min_headway_minutes * 60,
      max_headway_seconds: values.max_headway_minutes * 60,
    };

    await activateMut.mutateAsync({ routeId, payload });
    onSuccess?.();
  };

  return (
    <div className="max-w-2xl">
      {/* ─── Header info ─── */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-[#E6F4F5] border border-[#A8D5D8] mb-6">
        <div className="w-9 h-9 rounded-lg bg-[#169BA2] flex items-center justify-center flex-shrink-0">
          <Info size={16} className="text-white" />
        </div>
        <div className="min-w-0">
          <div className="text-sm font-bold text-[#0F7075] mb-0.5">
            Tuyến đang ở trạng thái nháp
          </div>
          <div className="text-xs text-[#12868C] leading-relaxed">
            Điền thông tin vận hành bên dưới để đưa tuyến vào khai thác chính
            thức. Sau khi kích hoạt, bạn có thể sinh chuyến tự động.
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* ═══════════ SECTION 1: Thông tin cơ bản ═══════════ */}
        <section className="bg-white rounded-xl border border-[#E5EAF0] p-5 space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-[#E5EAF0]">
            <div className="w-7 h-7 rounded-lg bg-[#E6F4F5] flex items-center justify-center">
              <Settings2 size={13} className="text-[#169BA2]" />
            </div>
            <h3 className="text-sm font-bold text-[#1A2332]">
              Thông tin cơ bản
            </h3>
          </div>

          {/* Mô tả */}
          <Field
            icon={FileText}
            label="Mô tả tuyến"
            error={errors.description?.message}
            hint="Mô tả ngắn gọn về tuyến (không bắt buộc)"
          >
            <textarea
              {...register("description")}
              placeholder="VD: Tuyến kết nối trung tâm thành phố với khu đô thị ĐHQG..."
              rows={3}
              className="w-full px-3.5 py-2.5 rounded-lg border border-[#D0D7E2] bg-white text-sm text-[#1A2332] placeholder:text-[#B0BCCA] outline-none transition-all focus:border-[#169BA2] focus:ring-2 focus:ring-[#169BA2]/20 resize-none"
            />
          </Field>
        </section>

        {/* ═══════════ SECTION 2: Thời gian hoạt động ═══════════ */}
        <section className="bg-white rounded-xl border border-[#E5EAF0] p-5 space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-[#E5EAF0]">
            <div className="w-7 h-7 rounded-lg bg-[#E6F4F5] flex items-center justify-center">
              <Clock size={13} className="text-[#169BA2]" />
            </div>
            <h3 className="text-sm font-bold text-[#1A2332]">
              Thời gian hoạt động
            </h3>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field
              label="Giờ mở tuyến"
              required
              error={errors.operating_start_time?.message}
              hint="Chuyến đầu tiên xuất bến"
            >
              <Input
                type="time"
                {...register("operating_start_time")}
                className="font-mono"
              />
            </Field>

            <Field
              label="Giờ đóng tuyến"
              required
              error={errors.operating_end_time?.message}
              hint="Chuyến cuối cùng xuất bến"
            >
              <Input
                type="time"
                {...register("operating_end_time")}
                className="font-mono"
              />
            </Field>
          </div>
        </section>

        {/* ═══════════ SECTION 3: Giá vé ═══════════ */}
        <section className="bg-white rounded-xl border border-[#E5EAF0] p-5 space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-[#E5EAF0]">
            <div className="w-7 h-7 rounded-lg bg-[#E6F4F5] flex items-center justify-center">
              <DollarSign size={13} className="text-[#169BA2]" />
            </div>
            <h3 className="text-sm font-bold text-[#1A2332]">Giá vé</h3>
          </div>

          <Field
            label="Giá vé cơ bản"
            required
            error={errors.base_fare?.message}
            hint="Áp dụng cho toàn tuyến (đồng giá)"
          >
            <div className="relative">
              <Input
                type="number"
                step="500"
                min="0"
                {...register("base_fare")}
                className="pr-14 font-mono text-base font-semibold"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-[#8A9AAA] pointer-events-none">
                VNĐ
              </span>
            </div>
          </Field>
        </section>

        {/* ═══════════ SECTION 4: Giãn cách ═══════════ */}
        <section className="bg-white rounded-xl border border-[#E5EAF0] p-5 space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-[#E5EAF0]">
            <div className="w-7 h-7 rounded-lg bg-[#E6F4F5] flex items-center justify-center">
              <Timer size={13} className="text-[#169BA2]" />
            </div>
            <h3 className="text-sm font-bold text-[#1A2332]">
              Giãn cách giữa các chuyến
            </h3>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field
              label="Giãn cách tối thiểu"
              required
              error={errors.min_headway_minutes?.message}
              hint="VD: 15 phút giờ cao điểm"
            >
              <div className="relative">
                <Input
                  type="number"
                  min="1"
                  {...register("min_headway_minutes")}
                  className="pr-14 font-mono text-base font-semibold"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-[#8A9AAA] pointer-events-none">
                  phút
                </span>
              </div>
            </Field>

            <Field
              label="Giãn cách tối đa"
              required
              error={errors.max_headway_minutes?.message}
              hint="VD: 30 phút giờ thấp điểm"
            >
              <div className="relative">
                <Input
                  type="number"
                  min="1"
                  {...register("max_headway_minutes")}
                  className="pr-14 font-mono text-base font-semibold"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-[#8A9AAA] pointer-events-none">
                  phút
                </span>
              </div>
            </Field>
          </div>

          <div className="flex items-start gap-2 p-3 rounded-lg bg-[#F8FAFC] border border-[#E5EAF0] text-[11px] text-[#6A7A9A]">
            <Info size={12} className="flex-shrink-0 mt-0.5 text-[#8A9AAA]" />
            <span>
              Giãn cách này dùng để sinh chuyến tự động. Bạn có thể điều chỉnh
              giãn cách riêng cho từng khung giờ sau khi sinh chuyến.
            </span>
          </div>
        </section>

        {/* ═══════════ SECTION 5: Multi-timeframe Headway ═══════════ */}
        <section className="bg-white rounded-xl border border-[#E5EAF0] p-5">
          <HeadwayConfigEditor routeId={routeId} services={[]} />
        </section>

        {/* ═══════════ ACTIONS ═══════════ */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            type="submit"
            variant="primary"
            disabled={isSubmitting}
            className="bg-[#169BA2] hover:bg-[#12868C] text-white h-11 px-6"
          >
            {isSubmitting ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Đang kích hoạt...
              </>
            ) : (
              <>
                <Play size={14} />
                Kích hoạt tuyến
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}

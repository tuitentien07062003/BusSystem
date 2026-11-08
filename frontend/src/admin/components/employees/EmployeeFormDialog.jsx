import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
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
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useCreateEmployee, useUpdateEmployee } from "@/hooks/useEmployees";

const schema = z
  .object({
    employee_code: z.string().trim().min(1, "Mã nhân viên không được để trống"),
    full_name: z.string().trim().min(1, "Họ tên không được để trống"),
    type: z.enum(["driver", "co_driver", "depot_staff", "dispatcher"], {
      message: "Vui lòng chọn loại nhân viên",
    }),
    phone: z
      .string()
      .trim()
      .optional()
      .refine(
        (v) => !v || /^(0|\+84)\d{9,10}$/.test(v.replace(/\s+/g, "")),
        "Số điện thoại không đúng định dạng (VD: 0912345678)",
      ),
    email: z
      .string()
      .trim()
      .optional()
      .refine(
        (v) => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
        "Email không đúng định dạng",
      ),
    license_number: z.string().trim().optional(),
    license_class: z.string().trim().optional(),
    license_expiry: z.string().optional(),
    hire_date: z.string().optional(),
    is_active: z.boolean(),
  })
  .refine(
    (d) => {
      if (d.type === "driver" && d.license_expiry && !d.license_class) {
        return false;
      }
      return true;
    },
    {
      message: "Tài xế có ngày hết hạn bằng lái thì phải nhập hạng bằng",
      path: ["license_class"],
    },
  );

// ═══════════════════════════════════════════════════════════════
// Component
// ═══════════════════════════════════════════════════════════════
export function EmployeeFormDialog({ employee, open, onOpenChange }) {
  const isEdit = !!employee;
  const createMut = useCreateEmployee();
  const updateMut = useUpdateEmployee();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    control,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      employee_code: "",
      full_name: "",
      type: "driver",
      phone: "",
      email: "",
      license_number: "",
      license_class: "",
      license_expiry: "",
      hire_date: "",
      is_active: true,
    },
  });

  useEffect(() => {
    if (open) {
      reset(
        employee
          ? {
              employee_code: employee.employee_code || "",
              full_name: employee.full_name || "",
              type: employee.type || "driver",
              phone: employee.phone || "",
              email: employee.email || "",
              license_number: employee.license_number || "",
              license_class: employee.license_class || "",
              license_expiry: employee.license_expiry || "",
              hire_date: employee.hire_date || "",
              is_active: employee.is_active ?? true,
            }
          : {
              employee_code: "",
              full_name: "",
              type: "driver",
              phone: "",
              email: "",
              license_number: "",
              license_class: "",
              license_expiry: "",
              hire_date: "",
              is_active: true,
            },
      );
    }
  }, [open, employee, reset]);

  const currentType = watch("type");
  const isActive = watch("is_active");
  const showLicenseFields =
    currentType === "driver" || currentType === "co_driver";

  const onSubmit = async (values) => {
    const payload = {
      employee_code: values.employee_code.trim(),
      full_name: values.full_name.trim(),
      type: values.type,
      phone: values.phone?.trim() || null,
      email: values.email?.trim() || null,
      license_number: showLicenseFields
        ? values.license_number?.trim() || null
        : null,
      license_class: showLicenseFields
        ? values.license_class?.trim() || null
        : null,
      license_expiry: showLicenseFields ? values.license_expiry || null : null,
      hire_date: values.hire_date || null,
      is_active: values.is_active,
    };

    if (isEdit) {
      await updateMut.mutateAsync({ id: employee.id, payload });
    } else {
      await createMut.mutateAsync(payload);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? `Sửa nhân viên #${employee.id}` : "Thêm nhân viên"}
          </DialogTitle>
          <DialogDescription>
            Trường có dấu <b>*</b> là bắt buộc.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="px-5 py-4 space-y-4">
          {/* ─── Hàng 1: Mã + Loại ─── */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>
                Mã nhân viên <span className="text-rose-500">*</span>
              </Label>
              <Input
                {...register("employee_code")}
                placeholder="VD: DRV_001"
                disabled={isEdit}
              />
              {errors.employee_code && (
                <p className="text-[11px] text-[#C0392B]">
                  {errors.employee_code.message}
                </p>
              )}
            </div>

            <div className="space-y-1">
              <Label>
                Loại nhân viên <span className="text-rose-500">*</span>
              </Label>
              <Controller
                name="type"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="driver">Tài xế</SelectItem>
                      <SelectItem value="co_driver">Lơ xe</SelectItem>
                      <SelectItem value="depot_staff">
                        Nhân viên depot
                      </SelectItem>
                      <SelectItem value="dispatcher">Điều độ viên</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.type && (
                <p className="text-[11px] text-[#C0392B]">
                  {errors.type.message}
                </p>
              )}
            </div>
          </div>

          {/* ─── Hàng 2: Họ tên ─── */}
          <div className="space-y-1">
            <Label>
              Họ và tên <span className="text-rose-500">*</span>
            </Label>
            <Input {...register("full_name")} placeholder="VD: Nguyễn Văn An" />
            {errors.full_name && (
              <p className="text-[11px] text-[#C0392B]">
                {errors.full_name.message}
              </p>
            )}
          </div>

          {/* ─── Hàng 3: SĐT + Email ─── */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Số điện thoại</Label>
              <Input {...register("phone")} placeholder="0912345678" />
              {errors.phone && (
                <p className="text-[11px] text-[#C0392B]">
                  {errors.phone.message}
                </p>
              )}
            </div>

            <div className="space-y-1">
              <Label>Email</Label>
              <Input
                type="email"
                {...register("email")}
                placeholder="ten@tbus.vn"
              />
              {errors.email && (
                <p className="text-[11px] text-[#C0392B]">
                  {errors.email.message}
                </p>
              )}
            </div>
          </div>

          {/* ─── Khối bằng lái — chỉ hiện với tài xế / lơ xe ─── */}
          {showLicenseFields && (
            <div className="pt-3 border-t border-[#EEF2F6] space-y-3">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-[#8A9AAA]">
                Thông tin bằng lái
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label>Hạng bằng</Label>
                  <Input
                    {...register("license_class")}
                    placeholder="VD: D, E"
                  />
                  {errors.license_class && (
                    <p className="text-[11px] text-[#C0392B]">
                      {errors.license_class.message}
                    </p>
                  )}
                </div>

                <div className="space-y-1">
                  <Label>Số bằng lái</Label>
                  <Input
                    {...register("license_number")}
                    placeholder="VD: GPLX-001234"
                  />
                </div>

                <div className="space-y-1">
                  <Label>Ngày hết hạn</Label>
                  <Input type="date" {...register("license_expiry")} />
                </div>
              </div>
            </div>
          )}

          {/* ─── Ngày vào làm ─── */}
          <div className="space-y-1">
            <Label>Ngày vào làm</Label>
            <Input type="date" {...register("hire_date")} />
          </div>

          {/* ─── Trạng thái ─── */}
          <div className="flex items-center justify-between py-2 border-t border-[#EEF2F6]">
            <div>
              <Label>Đang hoạt động</Label>
              <div className="text-[11px] text-[#8A9AAA] mt-0.5">
                Nhân viên ngưng hoạt động sẽ không được phân ca
              </div>
            </div>
            <Switch
              checked={isActive}
              onCheckedChange={(v) => setValue("is_active", v)}
            />
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
                  : "Tạo nhân viên"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

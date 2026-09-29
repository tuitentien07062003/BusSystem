import { useForm } from "react-hook-form";
import { useEffect, useState } from "react";
import {
  Building2,
  Globe,
  Clock,
  CheckCircle2,
  Shield,
  Bus,
  Route as RouteIcon,
  MapPin,
  CalendarDays,
  Edit3,
  Save,
  X,
  Loader2,
  Phone,
  Mail,
  MapPinned,
} from "lucide-react";
import { useAgenciesList, useUpdateAgency } from "@/hooks/useAgencies";
import { useRoutesList } from "@/hooks/useRoutes";
import { useStopsList } from "@/hooks/useStops";
import { useCalendarsList } from "@/hooks/useServiceCalendars";
import { useTripsList } from "@/hooks/useTrips";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

// ═══════════════════════════════════════════════════════════════
// Stat card nhỏ
// ═══════════════════════════════════════════════════════════════
function StatTile({ icon: Icon, label, value, loading }) {
  return (
    <div className="bg-white rounded-xl border border-[#E5EAF0] p-4 flex items-center gap-3">
      <div className="w-11 h-11 rounded-lg bg-[#E6F4F5] flex items-center justify-center flex-shrink-0">
        <Icon size={18} className="text-[#169BA2]" />
      </div>
      <div className="min-w-0">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-[#8A9AAA]">
          {label}
        </div>
        <div className="text-xl font-bold text-[#1A2332] leading-tight">
          {loading ? "—" : (value ?? 0).toLocaleString("vi-VN")}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Field (readonly hoặc editable)
// ═══════════════════════════════════════════════════════════════
function Field({ icon: Icon, label, value, editing, register, name, errors }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-[#8A9AAA]">
        <Icon size={12} />
        {label}
      </div>
      {editing ? (
        <Input {...register(name)} placeholder={value || ""} />
      ) : (
        <div className="text-sm text-[#1A2332] font-medium py-2 border-b border-[#E5EAF0]">
          {value || <span className="text-[#B0BCCA]">— Chưa có —</span>}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════
export function OrganizationPage() {
  const [editing, setEditing] = useState(false);

  // Load dữ liệu
  const { data: agenciesData, isLoading: loadingAgency } = useAgenciesList({
    page: 1,
    limit: 1,
  });
  const agency = agenciesData?.data?.[0];

  // Load stats
  const { data: routesData, isLoading: loadingRoutes } = useRoutesList({
    page: 1,
    limit: 1,
  });
  const { data: stopsData, isLoading: loadingStops } = useStopsList({
    page: 1,
    limit: 1,
  });
  const { data: calendarsData, isLoading: loadingCalendars } = useCalendarsList(
    { page: 1, limit: 1 },
  );
  const { data: tripsData, isLoading: loadingTrips } = useTripsList({
    page: 1,
    limit: 1,
  });

  const updateMut = useUpdateAgency();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      agency_name: "",
      agency_url: "",
      agency_timezone: "",
    },
  });

  // Load data vào form khi có agency
  useEffect(() => {
    if (agency) {
      reset({
        agency_name: agency.agency_name || "",
        agency_url: agency.agency_url || "",
        agency_timezone: agency.agency_timezone || "",
      });
    }
  }, [agency, reset]);

  const onSubmit = async (values) => {
    if (!agency) return;
    await updateMut.mutateAsync({ id: agency.id, payload: values });
    setEditing(false);
  };

  const handleCancel = () => {
    if (agency) {
      reset({
        agency_name: agency.agency_name || "",
        agency_url: agency.agency_url || "",
        agency_timezone: agency.agency_timezone || "",
      });
    }
    setEditing(false);
  };

  if (loadingAgency) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 size={24} className="animate-spin text-[#169BA2]" />
      </div>
    );
  }

  if (!agency) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-full bg-[#E6F4F5] flex items-center justify-center mx-auto mb-4">
            <Building2 size={26} className="text-[#169BA2]" />
          </div>
          <h2 className="text-lg font-bold text-[#1A2332] mb-2">
            Chưa có thông tin tổ chức
          </h2>
          <p className="text-sm text-[#6A7A9A]">
            Vui lòng liên hệ quản trị viên hệ thống để thiết lập thông tin.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-[#EEF2F6] scrollbar-thin">
      {/* ═══════════ HERO BANNER ═══════════ */}
      <div className="relative bg-white border-b border-[#E5EAF0]">
        {/* Nền nhẹ - brand color */}
        <div className="absolute inset-0 bg-[#169BA2] opacity-[0.04]" />

        <div className="relative px-8 py-8">
          <div className="max-w-[1400px] mx-auto">
            <div className="flex items-center gap-6">
              {/* Logo lớn */}
              <div className="w-32 h-32 flex-shrink-0 flex items-center justify-center">
                <img
                  src="/logo/tbus-logo.webp"
                  alt="TBus"
                  className="w-full h-full object-contain drop-shadow-sm"
                />
              </div>

              {/* Info */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-2xl font-bold text-[#1A2332] tracking-tight">
                    {agency.agency_name}
                  </h1>
                  {agency.is_active ? (
                    <Badge variant="success">
                      <CheckCircle2 size={11} />
                      Đang hoạt động
                    </Badge>
                  ) : (
                    <Badge variant="danger">
                      <X size={11} />
                      Ngừng hoạt động
                    </Badge>
                  )}
                </div>

                <div className="text-sm text-[#6A7A9A] leading-relaxed max-w-2xl">
                  Đơn vị vận hành hệ thống xe buýt nội thành — quản lý tuyến,
                  trạm dừng, lịch chạy và điều hành vận tải hành khách công
                  cộng.
                </div>

                <div className="flex items-center gap-4 mt-3 text-xs text-[#8A9AAA]">
                  <span className="inline-flex items-center gap-1.5">
                    <Shield size={12} />
                    Mã:{" "}
                    <span className="font-mono font-semibold text-[#169BA2]">
                      {agency.agency_id}
                    </span>
                  </span>
                </div>
              </div>

              {/* Action */}
              {!editing ? (
                <Button
                  variant="outline"
                  onClick={() => setEditing(true)}
                  className="flex-shrink-0 border-[#169BA2] text-[#169BA2] hover:bg-[#E6F4F5]"
                >
                  <Edit3 size={14} />
                  Chỉnh sửa
                </Button>
              ) : (
                <div className="flex gap-2 flex-shrink-0">
                  <Button
                    variant="secondary"
                    onClick={handleCancel}
                    disabled={isSubmitting}
                  >
                    <X size={14} />
                    Hủy
                  </Button>
                  <Button
                    variant="primary"
                    onClick={handleSubmit(onSubmit)}
                    disabled={isSubmitting}
                    className="bg-[#169BA2] hover:bg-[#12868C]"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 size={14} className="animate-spin" /> Đang
                        lưu...
                      </>
                    ) : (
                      <>
                        <Save size={14} /> Lưu thay đổi
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════ MAIN CONTENT ═══════════ */}
      <div className="max-w-[1400px] mx-auto px-8 py-8 space-y-6">
        {/* ─── SECTION 1: Thống kê tổng quan ─── */}
        <section>
          <h2 className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#8A9AAA] mb-3">
            Tổng quan hệ thống
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatTile
              icon={RouteIcon}
              label="Tuyến đường"
              value={routesData?.total}
              loading={loadingRoutes}
            />
            <StatTile
              icon={MapPin}
              label="Trạm dừng & Depot"
              value={stopsData?.total}
              loading={loadingStops}
            />
            <StatTile
              icon={Clock}
              label="Chuyến xe"
              value={tripsData?.total}
              loading={loadingTrips}
            />
            <StatTile
              icon={CalendarDays}
              label="Lịch phục vụ"
              value={calendarsData?.total}
              loading={loadingCalendars}
            />
          </div>
        </section>

        {/* ─── SECTION 2: Thông tin tổ chức ─── */}
        <section>
          <h2 className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#8A9AAA] mb-3">
            Thông tin đơn vị
          </h2>

          <div className="bg-white rounded-xl border border-[#E5EAF0] overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 p-6">
              <Field
                icon={Building2}
                label="Tên đơn vị"
                value={agency.agency_name}
                editing={editing}
                register={register}
                name="agency_name"
                errors={errors}
              />

              <Field
                icon={Globe}
                label="Website"
                value={agency.agency_url}
                editing={editing}
                register={register}
                name="agency_url"
                errors={errors}
              />

              <Field
                icon={Clock}
                label="Múi giờ"
                value={agency.agency_timezone}
                editing={editing}
                register={register}
                name="agency_timezone"
                errors={errors}
              />

              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-[#8A9AAA]">
                  <CalendarDays size={12} />
                  Ngày tham gia
                </div>
                <div className="text-sm text-[#1A2332] font-medium py-2 border-b border-[#E5EAF0]">
                  {agency.created_at
                    ? new Date(agency.created_at).toLocaleDateString("vi-VN", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      })
                    : "—"}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── SECTION 3: Liên hệ ─── */}
        <section>
          <h2 className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#8A9AAA] mb-3">
            Liên hệ
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl border border-[#E5EAF0] p-5 flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#E6F4F5] flex items-center justify-center flex-shrink-0">
                <Phone size={16} className="text-[#169BA2]" />
              </div>
              <div className="min-w-0">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-[#8A9AAA] mb-0.5">
                  Hotline
                </div>
                <div className="text-sm font-semibold text-[#1A2332]">
                  1900 6067
                </div>
                <div className="text-[11px] text-[#8A9AAA] mt-0.5">
                  Hỗ trợ 24/7
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-[#E5EAF0] p-5 flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#E6F4F5] flex items-center justify-center flex-shrink-0">
                <Mail size={16} className="text-[#169BA2]" />
              </div>
              <div className="min-w-0">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-[#8A9AAA] mb-0.5">
                  Email
                </div>
                <div className="text-sm font-semibold text-[#1A2332] truncate">
                  contact@tbus.vn
                </div>
                <div className="text-[11px] text-[#8A9AAA] mt-0.5">
                  Phản hồi trong 24h
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-[#E5EAF0] p-5 flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#E6F4F5] flex items-center justify-center flex-shrink-0">
                <MapPinned size={16} className="text-[#169BA2]" />
              </div>
              <div className="min-w-0">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-[#8A9AAA] mb-0.5">
                  Trụ sở
                </div>
                <div className="text-sm font-semibold text-[#1A2332]">
                  TP. Hồ Chí Minh
                </div>
                <div className="text-[11px] text-[#8A9AAA] mt-0.5">
                  Việt Nam
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── FOOTER ─── */}
        <div className="pt-4 pb-2 text-center">
          <div className="text-[11px] text-[#B0BCCA]">
            TBus Vietnam · Hệ thống quản lý vận hành · Phiên bản 1.0.0
          </div>
        </div>
      </div>
    </div>
  );
}

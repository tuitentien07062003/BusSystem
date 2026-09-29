import { useState } from "react";
import {
  Loader2,
  Play,
  Pause,
  Edit3,
  X,
  Save,
  Sparkles,
  RefreshCw,
  Clock,
  DollarSign,
  Timer,
  FileText,
  Info,
  CheckCircle2,
  Ruler,
  Activity,
  AlertTriangle,
  ListOrdered,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  useRouteOperations,
  useUpdateRouteOperations,
  useDeactivateRoute,
  useRecomputeRouteStats,
} from "@/hooks/useRouteOperations";
import { useTripsList } from "@/hooks/useTrips";
import { RouteOperationForm } from "./RouteOperationForm";
import { TripGenerationDialog } from "./TripGenerationDialog";
import { RouteStatsPanel } from "./RouteStatsPanel";

// ═══════════════════════════════════════════════════════════════
// Schema cho edit form
// ═══════════════════════════════════════════════════════════════
const editSchema = z
  .object({
    description: z.string().trim().max(500).optional(),
    operating_start_time: z.string().regex(/^\d{1,2}:\d{2}$/, "HH:MM"),
    operating_end_time: z.string().regex(/^\d{1,2}:\d{2}$/, "HH:MM"),
    base_fare: z.coerce.number().int().min(0),
    min_headway_minutes: z.coerce.number().int().min(1).max(180),
    max_headway_minutes: z.coerce.number().int().min(1).max(180),
  })
  .refine((d) => d.operating_start_time < d.operating_end_time, {
    message: "Giờ mở phải nhỏ hơn giờ đóng",
    path: ["operating_end_time"],
  })
  .refine((d) => d.min_headway_minutes <= d.max_headway_minutes, {
    message: "Min phải <= Max",
    path: ["max_headway_minutes"],
  });

// ═══════════════════════════════════════════════════════════════
// Helper: format thời gian
// ═══════════════════════════════════════════════════════════════
function fmtTime(t) {
  if (!t) return "—";
  return String(t).slice(0, 5);
}

function fmtDuration(sec) {
  if (!sec) return "—";
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  if (h > 0) return `${h}h ${m}p`;
  return `${m} phút`;
}

function fmtDistance(m) {
  if (!m) return "—";
  return `${(m / 1000).toFixed(2)} km`;
}

function fmtCurrency(n) {
  if (n == null) return "—";
  return n.toLocaleString("vi-VN") + " đ";
}

// ═══════════════════════════════════════════════════════════════
// Sub: InfoTile
// ═══════════════════════════════════════════════════════════════
function InfoTile({ icon: Icon, label, value, accent }) {
  return (
    <div className="flex items-start gap-3 p-4 rounded-lg bg-[#F8FAFC] border border-[#E5EAF0]">
      <div
        className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
          accent ? "bg-[#E6F4F5] text-[#169BA2]" : "bg-white text-[#6A7A9A]"
        }`}
      >
        <Icon size={16} />
      </div>
      <div className="min-w-0">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-[#8A9AAA] mb-0.5">
          {label}
        </div>
        <div className="text-sm font-bold text-[#1A2332] leading-tight">
          {value}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Sub: Edit Form (inline)
// ═══════════════════════════════════════════════════════════════
function EditOperationsForm({ routeId, operations, onCancel, onSuccess }) {
  const updateMut = useUpdateRouteOperations();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(editSchema),
    defaultValues: {
      description: operations.description || "",
      operating_start_time: fmtTime(operations.operating_start_time),
      operating_end_time: fmtTime(operations.operating_end_time),
      base_fare: operations.base_fare,
      min_headway_minutes: Math.floor(operations.min_headway_seconds / 60),
      max_headway_minutes: Math.floor(operations.max_headway_seconds / 60),
    },
  });

  const onSubmit = async (values) => {
    await updateMut.mutateAsync({
      routeId,
      payload: {
        description: values.description || null,
        operating_start_time: values.operating_start_time,
        operating_end_time: values.operating_end_time,
        base_fare: values.base_fare,
        min_headway_seconds: values.min_headway_minutes * 60,
        max_headway_seconds: values.max_headway_minutes * 60,
      },
    });
    onSuccess?.();
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="bg-white rounded-xl border-2 border-[#169BA2] p-5 space-y-4"
    >
      <div className="flex items-center gap-2 pb-3 border-b border-[#E5EAF0]">
        <Edit3 size={14} className="text-[#169BA2]" />
        <h3 className="text-sm font-bold text-[#1A2332]">
          Chỉnh sửa thông tin vận hành
        </h3>
      </div>

      {/* Mô tả */}
      <div className="space-y-1.5">
        <Label className="text-[11px] font-semibold uppercase tracking-wider text-[#8A9AAA]">
          Mô tả tuyến
        </Label>
        <textarea
          {...register("description")}
          rows={2}
          className="w-full px-3.5 py-2 rounded-lg border border-[#D0D7E2] text-sm outline-none focus:border-[#169BA2] focus:ring-2 focus:ring-[#169BA2]/20 resize-none"
        />
      </div>

      {/* Grid 2 cột */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label className="text-[11px] font-semibold uppercase tracking-wider text-[#8A9AAA]">
            Giờ mở
          </Label>
          <Input
            type="time"
            {...register("operating_start_time")}
            className="font-mono"
          />
          {errors.operating_start_time && (
            <p className="text-[11px] text-rose-600">
              {errors.operating_start_time.message}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label className="text-[11px] font-semibold uppercase tracking-wider text-[#8A9AAA]">
            Giờ đóng
          </Label>
          <Input
            type="time"
            {...register("operating_end_time")}
            className="font-mono"
          />
          {errors.operating_end_time && (
            <p className="text-[11px] text-rose-600">
              {errors.operating_end_time.message}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label className="text-[11px] font-semibold uppercase tracking-wider text-[#8A9AAA]">
            Giá vé (VNĐ)
          </Label>
          <Input
            type="number"
            step="500"
            {...register("base_fare")}
            className="font-mono"
          />
          {errors.base_fare && (
            <p className="text-[11px] text-rose-600">
              {errors.base_fare.message}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label className="text-[11px] font-semibold uppercase tracking-wider text-[#8A9AAA]">
            Giãn cách min (phút)
          </Label>
          <Input
            type="number"
            {...register("min_headway_minutes")}
            className="font-mono"
          />
          {errors.min_headway_minutes && (
            <p className="text-[11px] text-rose-600">
              {errors.min_headway_minutes.message}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label className="text-[11px] font-semibold uppercase tracking-wider text-[#8A9AAA]">
            Giãn cách max (phút)
          </Label>
          <Input
            type="number"
            {...register("max_headway_minutes")}
            className="font-mono"
          />
          {errors.max_headway_minutes && (
            <p className="text-[11px] text-rose-600">
              {errors.max_headway_minutes.message}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          <X size={13} />
          Hủy
        </Button>
        <Button
          type="submit"
          variant="primary"
          disabled={isSubmitting}
          className="bg-[#169BA2] hover:bg-[#12868C] text-white"
        >
          {isSubmitting ? (
            <>
              <Loader2 size={13} className="animate-spin" />
              Đang lưu...
            </>
          ) : (
            <>
              <Save size={13} />
              Lưu thay đổi
            </>
          )}
        </Button>
      </div>
    </form>
  );
}

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════
export function RouteOperationsPanel({ routeId }) {
  const [editing, setEditing] = useState(false);
  const [genDialogOpen, setGenDialogOpen] = useState(false);

  const { data, isLoading, refetch } = useRouteOperations(routeId);
  const deactivateMut = useDeactivateRoute();
  const recomputeMut = useRecomputeRouteStats();

  // Đếm trips để biết có trips chưa
  const { data: tripsData } = useTripsList({ page: 1, limit: 1 });
  const hasExistingTrips = (data?.trip_count ?? 0) > 0;

  // ─── LOADING ───
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 size={22} className="animate-spin text-[#169BA2]" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12 text-sm text-[#8A9AAA]">
        Không tải được thông tin vận hành.
      </div>
    );
  }

  const isOperating = data.is_operating;
  const ops = data.operations;
  const stats = data.stats;

  // ═══════════════════════════════════════════════════════════════
  // TRƯỜNG HỢP 1: DRAFT — hiển thị form kích hoạt
  // ═══════════════════════════════════════════════════════════════
  if (!isOperating) {
    return <RouteOperationForm routeId={routeId} onSuccess={() => refetch()} />;
  }

  // ═══════════════════════════════════════════════════════════════
  // TRƯỜNG HỢP 2: OPERATING — hiển thị metadata + actions
  // ═══════════════════════════════════════════════════════════════

  // Nếu đang edit → hiển thị form inline
  if (editing) {
    return (
      <EditOperationsForm
        routeId={routeId}
        operations={ops}
        onCancel={() => setEditing(false)}
        onSuccess={() => {
          setEditing(false);
          refetch();
        }}
      />
    );
  }

  return (
    <div className="space-y-5">
      {/* ═══════════ BANNER STATUS ═══════════ */}
      <div className="flex items-start justify-between gap-4 p-4 rounded-xl bg-[#E6F4F5] border border-[#A8D5D8]">
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-10 h-10 rounded-lg bg-[#169BA2] flex items-center justify-center flex-shrink-0">
            <CheckCircle2 size={18} className="text-white" />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-bold text-[#0F7075] mb-0.5">
              Tuyến đang ở trạng thái vận hành
            </div>
            <div className="text-xs text-[#12868C]">
              {hasExistingTrips
                ? `Đã có ${data.trip_count} chuyến`
                : "Chưa có chuyến nào — hãy sinh chuyến tự động"}
            </div>
          </div>
        </div>

        <Badge variant="success">
          <Activity size={10} />
          Hoạt động
        </Badge>
      </div>

      {/* ═══════════ METADATA INFO ═══════════ */}
      <div className="bg-white rounded-xl border border-[#E5EAF0]">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-[#E5EAF0]">
          <div className="flex items-center gap-2">
            <FileText size={13} className="text-[#169BA2]" />
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-[#4A5A7A]">
              Thông tin vận hành
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => recomputeMut.mutate(routeId)}
              disabled={recomputeMut.isPending}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-semibold text-[#6A7A9A] hover:bg-[#F8FAFC] hover:text-[#169BA2] cursor-pointer transition-colors disabled:opacity-50"
            >
              <RefreshCw
                size={12}
                className={recomputeMut.isPending ? "animate-spin" : ""}
              />
              Tính lại
            </button>
            <button
              onClick={() => setEditing(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-semibold text-[#169BA2] bg-[#E6F4F5] hover:bg-[#A8D5D8] cursor-pointer transition-colors"
            >
              <Edit3 size={12} />
              Chỉnh sửa
            </button>
          </div>
        </div>

        {/* Mô tả */}
        {ops.description && (
          <div className="px-5 pt-4">
            <div className="text-xs text-[#6A7A9A] leading-relaxed">
              {ops.description}
            </div>
          </div>
        )}

        {/* Grid info */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 p-5">
          <InfoTile
            icon={Clock}
            label="Giờ hoạt động"
            value={`${fmtTime(ops.operating_start_time)} – ${fmtTime(
              ops.operating_end_time,
            )}`}
            accent
          />
          <InfoTile
            icon={DollarSign}
            label="Giá vé"
            value={fmtCurrency(ops.base_fare)}
            accent
          />
          <InfoTile
            icon={Timer}
            label="Giãn cách thiết kế"
            value={`${Math.floor(ops.min_headway_seconds / 60)}–${Math.floor(
              ops.max_headway_seconds / 60,
            )} phút`}
            accent
          />
        </div>
      </div>

      {/* ═══════════ STATS CACHE ═══════════ */}
      {stats && (
        <div className="bg-white rounded-xl border border-[#E5EAF0]">
          <div className="flex items-center gap-2 px-5 py-4 border-b border-[#E5EAF0]">
            <Ruler size={13} className="text-[#169BA2]" />
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-[#4A5A7A]">
              Số liệu tuyến
            </h3>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-5">
            <InfoTile
              icon={Ruler}
              label="Chiều đi"
              value={`${fmtDistance(stats.go_length_m)} · ${fmtDuration(
                stats.go_travel_time_sec,
              )}`}
            />
            <InfoTile
              icon={Ruler}
              label="Chiều về"
              value={`${fmtDistance(stats.return_length_m)} · ${fmtDuration(
                stats.return_travel_time_sec,
              )}`}
            />
            <InfoTile
              icon={ListOrdered}
              label="Số chuyến"
              value={data.trip_count ?? 0}
              accent
            />
            <InfoTile
              icon={Info}
              label="Cập nhật"
              value={
                stats.computed_at
                  ? new Date(stats.computed_at).toLocaleDateString("vi-VN")
                  : "—"
              }
            />
          </div>
        </div>
      )}

      {/* ═══════════ GENERATE TRIPS CTA ═══════════ */}
      <div className="bg-white rounded-xl border border-[#E5EAF0] p-5">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-9 h-9 rounded-lg bg-[#FFF3E0] flex items-center justify-center flex-shrink-0">
            <Sparkles size={16} className="text-[#E08940]" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-bold text-[#1A2332] mb-1">
              {hasExistingTrips ? "Sinh lại chuyến" : "Sinh chuyến tự động"}
            </div>
            <div className="text-xs text-[#6A7A9A] leading-relaxed">
              {hasExistingTrips
                ? "Hệ thống sẽ sinh lại danh sách chuyến dựa trên metadata. Bạn có thể chọn xóa hết hoặc thêm vào."
                : "Hệ thống sẽ tự động tạo danh sách chuyến dựa trên giờ hoạt động, giãn cách và lịch phục vụ."}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            onClick={() => setGenDialogOpen(true)}
            className="bg-[#169BA2] hover:bg-[#12868C] text-white"
          >
            <Sparkles size={14} />
            {hasExistingTrips ? "Sinh lại chuyến" : "Sinh chuyến"}
          </Button>

          {!hasExistingTrips && (
            <div className="flex items-center gap-1.5 text-[11px] text-[#E08940]">
              <AlertTriangle size={12} />
              <span>Chưa có chuyến nào</span>
            </div>
          )}
        </div>
      </div>

      {/* ═══════════ STATS BY DATE ═══════════ */}
      {hasExistingTrips && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Activity size={13} className="text-[#169BA2]" />
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-[#4A5A7A]">
              Số liệu khai thác theo ngày
            </h3>
          </div>
          <RouteStatsPanel routeId={routeId} />
        </div>
      )}

      {/* ═══════════ DANGER ZONE ═══════════ */}
      <div className="bg-white rounded-xl border border-[#FFCDD2] p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="text-sm font-bold text-[#C62828] mb-1">
              Hủy kích hoạt tuyến
            </div>
            <div className="text-xs text-[#6A7A9A] leading-relaxed">
              Tuyến sẽ chuyển về trạng thái nháp. Các chuyến đã sinh vẫn được
              giữ lại nhưng tuyến sẽ không hoạt động.
            </div>
          </div>
          <Button
            variant="secondary"
            onClick={() => {
              if (
                confirm(
                  "Bạn chắc chắn muốn hủy kích hoạt tuyến? Các chuyến vẫn được giữ lại.",
                )
              ) {
                deactivateMut.mutate(routeId, {
                  onSuccess: () => refetch(),
                });
              }
            }}
            disabled={deactivateMut.isPending}
            className="border-[#FFCDD2] text-[#C62828] hover:bg-[#FFEBEE] flex-shrink-0"
          >
            {deactivateMut.isPending ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <Pause size={13} />
            )}
            Hủy kích hoạt
          </Button>
        </div>
      </div>

      {/* ═══════════ DIALOG ═══════════ */}
      <TripGenerationDialog
        open={genDialogOpen}
        onClose={() => setGenDialogOpen(false)}
        routeId={routeId}
        operations={ops}
        hasExistingTrips={hasExistingTrips}
      />
    </div>
  );
}

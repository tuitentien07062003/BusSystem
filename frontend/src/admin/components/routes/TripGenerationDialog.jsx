import { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Loader2,
  Sparkles,
  CalendarDays,
  Timer,
  AlertTriangle,
  Info,
  ListOrdered,
  RefreshCw,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  usePreviewTrips,
  useGenerateTrips,
  useRegenerateTrips,
} from "@/hooks/useRouteOperations";
import { useCalendarsList } from "@/hooks/useServiceCalendars";

// ═══════════════════════════════════════════════════════════════
// MAIN DIALOG
// ═══════════════════════════════════════════════════════════════
export function TripGenerationDialog({
  open,
  onClose,
  routeId,
  operations,
  hasExistingTrips = false,
}) {
  // ─── State ───
  const [selectedServiceIds, setSelectedServiceIds] = useState([]);
  const [headwayMinutes, setHeadwayMinutes] = useState(15);
  const [mode, setMode] = useState(hasExistingTrips ? "reset" : "reset");
  const [preview, setPreview] = useState(null);

  // ─── Data ───
  const { data: calendarsData, isLoading: loadingCalendars } = useCalendarsList(
    { page: 1, limit: 100 },
  );
  const calendars = calendarsData?.data ?? [];

  // ─── Mutations ───
  const previewMut = usePreviewTrips();
  const generateMut = useGenerateTrips();
  const regenerateMut = useRegenerateTrips();

  // ─── Reset khi mở dialog ───
  useEffect(() => {
    if (open) {
      // Auto-select tất cả services
      setSelectedServiceIds(calendars.map((c) => c.id));
      // Default headway = min_headway_seconds
      if (operations?.min_headway_seconds) {
        setHeadwayMinutes(Math.floor(operations.min_headway_seconds / 60));
      }
      setMode(hasExistingTrips ? "reset" : "reset");
      setPreview(null);
    }
  }, [open, calendars, operations, hasExistingTrips]);

  // ─── Auto preview khi config thay đổi ───
  useEffect(() => {
    if (!open || !routeId) return;
    if (selectedServiceIds.length === 0) {
      setPreview(null);
      return;
    }

    const t = setTimeout(() => {
      previewMut.mutate(
        {
          routeId,
          payload: {
            service_ids: selectedServiceIds,
            headway_seconds: headwayMinutes * 60,
          },
        },
        {
          onSuccess: (data) => setPreview(data),
        },
      );
    }, 400);

    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, routeId, selectedServiceIds, headwayMinutes]);

  // ─── Handlers ───
  const toggleService = (id) => {
    setSelectedServiceIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const selectAllServices = () => {
    setSelectedServiceIds(calendars.map((c) => c.id));
  };

  const clearAllServices = () => {
    setSelectedServiceIds([]);
  };

  const handleGenerate = async () => {
    if (selectedServiceIds.length === 0) return;

    const payload = {
      service_ids: selectedServiceIds,
      headway_seconds: headwayMinutes * 60,
      mode,
    };

    if (hasExistingTrips && mode === "reset") {
      await regenerateMut.mutateAsync({ routeId, payload });
    } else {
      await generateMut.mutateAsync({ routeId, payload });
    }

    onClose?.();
  };

  const isGenerating = generateMut.isPending || regenerateMut.isPending;
  const canGenerate =
    selectedServiceIds.length > 0 && preview && preview.total_count > 0;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose?.()}>
      <DialogContent className="!max-w-[640px] w-[95vw] p-0">
        {/* ═══════════ HEADER ═══════════ */}
        <DialogHeader className="px-6 pt-6 pb-4">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-xl bg-[#E6F4F5] flex items-center justify-center flex-shrink-0">
              <Sparkles size={20} className="text-[#169BA2]" />
            </div>
            <div className="min-w-0">
              <DialogTitle className="text-base font-bold text-[#1A2332]">
                Sinh chuyến tự động
              </DialogTitle>
              <DialogDescription className="text-xs text-[#6A7A9A] mt-1">
                Hệ thống sẽ tạo danh sách chuyến dựa trên thông tin vận hành của
                tuyến. Bạn có thể chỉnh sửa sau khi sinh.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* ═══════════ BODY ═══════════ */}
        <div className="px-6 pb-4 space-y-5 max-h-[60vh] overflow-y-auto scrollbar-thin">
          {/* ─── SECTION 1: SERVICES ─── */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-[#8A9AAA]">
                <CalendarDays size={11} />
                Lịch phục vụ
              </Label>
              <div className="flex items-center gap-2 text-[11px]">
                <button
                  type="button"
                  onClick={selectAllServices}
                  className="text-[#169BA2] hover:text-[#0F7075] font-semibold cursor-pointer"
                >
                  Chọn tất cả
                </button>
                <span className="text-[#C2C8D4]">·</span>
                <button
                  type="button"
                  onClick={clearAllServices}
                  className="text-[#8A9AAA] hover:text-[#6A7A9A] cursor-pointer"
                >
                  Bỏ chọn
                </button>
              </div>
            </div>

            {loadingCalendars ? (
              <div className="flex items-center gap-2 py-4 text-xs text-[#8A9AAA]">
                <Loader2 size={12} className="animate-spin" />
                Đang tải lịch...
              </div>
            ) : calendars.length === 0 ? (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-[#FFF8E1] border border-[#FFE0A3] text-xs text-[#8B6914]">
                <AlertTriangle size={12} className="flex-shrink-0 mt-0.5" />
                <span>
                  Chưa có lịch phục vụ nào. Vui lòng tạo lịch ở mục{" "}
                  <b>Lịch phục vụ</b> trước.
                </span>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {calendars.map((cal) => {
                  const checked = selectedServiceIds.includes(cal.id);
                  const dayLabels = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];
                  const dayKeys = [
                    "monday",
                    "tuesday",
                    "wednesday",
                    "thursday",
                    "friday",
                    "saturday",
                    "sunday",
                  ];
                  const activeDays = dayKeys.filter((k) => cal[k]);

                  return (
                    <button
                      key={cal.id}
                      type="button"
                      onClick={() => toggleService(cal.id)}
                      className={`flex items-center gap-3 p-3 rounded-lg border text-left transition-all ${
                        checked
                          ? "bg-[#E6F4F5] border-[#169BA2] shadow-sm"
                          : "bg-white border-[#E5EAF0] hover:border-[#A8D5D8]"
                      }`}
                    >
                      <Checkbox
                        checked={checked}
                        onCheckedChange={() => toggleService(cal.id)}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-bold text-[#1A2332] truncate">
                          {cal.service_id}
                        </div>
                        <div className="flex gap-0.5 mt-1">
                          {dayLabels.map((lbl, i) => (
                            <span
                              key={i}
                              className={`text-[9px] w-4 h-4 rounded flex items-center justify-center font-bold ${
                                activeDays.includes(dayKeys[i])
                                  ? "bg-[#169BA2] text-white"
                                  : "bg-[#F0F3F7] text-[#B0BCCA]"
                              }`}
                            >
                              {lbl}
                            </span>
                          ))}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* ─── SECTION 2: HEADWAY ─── */}
          <div className="space-y-3">
            <Label className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-[#8A9AAA]">
              <Timer size={11} />
              Giãn cách sinh chuyến
            </Label>

            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Input
                  type="number"
                  min="1"
                  max="180"
                  value={headwayMinutes}
                  onChange={(e) =>
                    setHeadwayMinutes(parseInt(e.target.value) || 1)
                  }
                  className="pr-14 font-mono text-base font-semibold"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-[#8A9AAA] pointer-events-none">
                  phút
                </span>
              </div>

              {operations && (
                <div className="text-[11px] text-[#8A9AAA] whitespace-nowrap">
                  Thiết kế:{" "}
                  <span className="font-semibold text-[#169BA2]">
                    {Math.floor(operations.min_headway_seconds / 60)}–
                    {Math.floor(operations.max_headway_seconds / 60)} phút
                  </span>
                </div>
              )}
            </div>

            {/* Quick presets */}
            <div className="flex gap-1.5">
              {[10, 15, 20, 30].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setHeadwayMinutes(m)}
                  className={`px-3 py-1 rounded-md text-[11px] font-semibold border transition-all ${
                    headwayMinutes === m
                      ? "bg-[#169BA2] text-white border-[#169BA2]"
                      : "bg-white text-[#6A7A9A] border-[#E5EAF0] hover:border-[#A8D5D8]"
                  }`}
                >
                  {m} phút
                </button>
              ))}
            </div>
          </div>

          {/* ─── SECTION 3: MODE (chỉ khi đã có trips) ─── */}
          {hasExistingTrips && (
            <div className="space-y-3">
              <Label className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-[#8A9AAA]">
                <RefreshCw size={11} />
                Chế độ sinh
              </Label>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setMode("reset")}
                  className={`p-3 rounded-lg border text-left transition-all ${
                    mode === "reset"
                      ? "bg-[#FFF3E0] border-[#FFB74D]"
                      : "bg-white border-[#E5EAF0] hover:border-[#FFB74D]"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <RefreshCw
                      size={12}
                      className={
                        mode === "reset" ? "text-[#E08940]" : "text-[#8A9AAA]"
                      }
                    />
                    <span className="text-xs font-bold text-[#1A2332]">
                      Sinh lại hoàn toàn
                    </span>
                  </div>
                  <div className="text-[10px] text-[#6A7A9A] leading-relaxed">
                    Xóa hết chuyến cũ, tạo mới toàn bộ
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setMode("additive")}
                  className={`p-3 rounded-lg border text-left transition-all ${
                    mode === "additive"
                      ? "bg-[#E6F4F5] border-[#169BA2]"
                      : "bg-white border-[#E5EAF0] hover:border-[#A8D5D8]"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <ListOrdered
                      size={12}
                      className={
                        mode === "additive"
                          ? "text-[#169BA2]"
                          : "text-[#8A9AAA]"
                      }
                    />
                    <span className="text-xs font-bold text-[#1A2332]">
                      Thêm vào
                    </span>
                  </div>
                  <div className="text-[10px] text-[#6A7A9A] leading-relaxed">
                    Giữ chuyến cũ, chỉ thêm chuyến mới
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* ─── SECTION 4: PREVIEW ─── */}
          <div className="space-y-3">
            <Label className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-[#8A9AAA]">
              <Info size={11} />
              Xem trước
            </Label>

            {previewMut.isPending ? (
              <div className="flex items-center justify-center gap-2 py-6 text-xs text-[#8A9AAA]">
                <Loader2 size={14} className="animate-spin text-[#169BA2]" />
                Đang tính toán...
              </div>
            ) : !preview || preview.total_count === 0 ? (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-[#FFF8E1] border border-[#FFE0A3] text-xs text-[#8B6914]">
                <AlertTriangle size={12} className="flex-shrink-0 mt-0.5" />
                <span>
                  {selectedServiceIds.length === 0
                    ? "Vui lòng chọn ít nhất 1 lịch phục vụ."
                    : "Không có chuyến nào được sinh. Kiểm tra lại giãn cách và giờ hoạt động."}
                </span>
              </div>
            ) : (
              <div className="rounded-xl bg-[#E6F4F5] border border-[#A8D5D8] p-4">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle2 size={14} className="text-[#169BA2]" />
                  <span className="text-sm font-bold text-[#0F7075]">
                    Sẽ sinh {preview.total_count} chuyến
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-[#12868C] font-semibold mb-0.5">
                      Chiều đi
                    </div>
                    <div className="text-lg font-bold text-[#0F7075] leading-none">
                      {preview.counts_by_direction?.go ?? 0}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-[#12868C] font-semibold mb-0.5">
                      Chiều về
                    </div>
                    <div className="text-lg font-bold text-[#0F7075] leading-none">
                      {preview.counts_by_direction?.return ?? 0}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-[#12868C] font-semibold mb-0.5">
                      Khung giờ
                    </div>
                    <div className="text-xs font-bold text-[#0F7075] font-mono leading-none pt-1">
                      {preview.first_trip_time?.slice(0, 5)} –{" "}
                      {preview.last_trip_time?.slice(0, 5)}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ─── Warning nếu mode reset + có trips cũ ─── */}
          {hasExistingTrips && mode === "reset" && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-[#FFEBEE] border border-[#FFCDD2] text-xs text-[#C62828]">
              <AlertTriangle size={12} className="flex-shrink-0 mt-0.5" />
              <span>
                Chuyến cũ của tuyến sẽ bị xóa hoàn toàn và không thể khôi phục.
              </span>
            </div>
          )}
        </div>

        {/* ═══════════ FOOTER ═══════════ */}
        <DialogFooter className="px-6 py-4 border-t border-[#E5EAF0] bg-[#F8FAFC]">
          <Button variant="secondary" onClick={onClose} disabled={isGenerating}>
            Hủy
          </Button>
          <Button
            variant="primary"
            onClick={handleGenerate}
            disabled={!canGenerate || isGenerating}
            className="bg-[#169BA2] hover:bg-[#12868C] text-white min-w-[140px]"
          >
            {isGenerating ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Đang sinh...
              </>
            ) : (
              <>
                <Sparkles size={14} />
                Sinh {preview?.total_count ?? 0} chuyến
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

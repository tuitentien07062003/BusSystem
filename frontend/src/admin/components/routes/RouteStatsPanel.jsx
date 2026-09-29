import { useState } from "react";
import {
  CalendarDays,
  Loader2,
  TrendingUp,
  Clock,
  ArrowRight,
  ArrowLeftRight,
  BarChart3,
  Info,
  AlertTriangle,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useRouteStatsByDate } from "@/hooks/useRouteOperations";

function today() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function dayOfWeekVN(dow) {
  const map = {
    monday: "Thứ 2",
    tuesday: "Thứ 3",
    wednesday: "Thứ 4",
    thursday: "Thứ 5",
    friday: "Thứ 6",
    saturday: "Thứ 7",
    sunday: "Chủ nhật",
  };
  return map[dow] || dow;
}

// ═══════════════════════════════════════════════════════════════
// Sub-component: Stat card nhỏ
// ═══════════════════════════════════════════════════════════════
function StatBox({ label, value, suffix, accent }) {
  return (
    <div
      className={`rounded-lg p-3 ${accent ? "bg-[#E6F4F5]" : "bg-[#F8FAFC]"}`}
    >
      <div
        className={`text-[10px] font-semibold uppercase tracking-wider mb-1 ${
          accent ? "text-[#12868C]" : "text-[#8A9AAA]"
        }`}
      >
        {label}
      </div>
      <div
        className={`text-xl font-bold leading-none ${
          accent ? "text-[#0F7075]" : "text-[#1A2332]"
        }`}
      >
        {value}
        {suffix && (
          <span
            className={`text-xs ml-1 font-medium ${
              accent ? "text-[#169BA2]" : "text-[#8A9AAA]"
            }`}
          >
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Sub-component: Headway timeline
// ═══════════════════════════════════════════════════════════════
function HeadwayTimeline({ trips, label, icon: Icon }) {
  if (!trips?.length) return null;

  // Hiển thị 5 mốc đầu + 3 mốc cuối nếu quá dài
  const total = trips.length;
  const showAll = total <= 12;
  const displayed = showAll
    ? trips
    : [...trips.slice(0, 8), { _divider: true }, ...trips.slice(-3)];

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Icon size={12} className="text-[#169BA2]" />
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#4A5A7A]">
            {label}
          </span>
        </div>
        <Badge variant="muted">{total} chuyến</Badge>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {displayed.map((item, idx) => {
          if (item._divider) {
            return (
              <span
                key={`div-${idx}`}
                className="self-center text-[10px] text-[#B0BCCA] px-1"
              >
                ···
              </span>
            );
          }
          return (
            <div
              key={idx}
              className="flex flex-col items-center gap-0.5 px-2 py-1 rounded bg-white border border-[#E5EAF0]"
              title={`Chuyến ${idx + 1}`}
            >
              <span className="text-[10px] font-mono font-semibold text-[#1A2332]">
                {item.from || item.start_time?.slice(0, 5)}
              </span>
              {item.gap_min !== undefined && idx > 0 && (
                <span className="text-[9px] text-[#8A9AAA] font-mono">
                  +{item.gap_min}p
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════
export function RouteStatsPanel({ routeId }) {
  const [date, setDate] = useState(today());

  const { data, isLoading, isFetching, isError, error } = useRouteStatsByDate(
    routeId,
    date,
  );

  const isPending = isLoading || isFetching;
  const stats = data;

  return (
    <div className="space-y-4">
      {/* ═══════════ DATE PICKER ═══════════ */}
      <div className="flex items-center justify-between gap-4 p-4 bg-white rounded-xl border border-[#E5EAF0]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#E6F4F5] flex items-center justify-center flex-shrink-0">
            <CalendarDays size={16} className="text-[#169BA2]" />
          </div>
          <div className="min-w-0">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-[#8A9AAA]">
              Xem số liệu ngày
            </div>
            <div className="text-xs text-[#6A7A9A] mt-0.5">
              {stats?.day_of_week
                ? dayOfWeekVN(stats.day_of_week)
                : "Đang tải..."}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isPending && (
            <Loader2 size={14} className="animate-spin text-[#169BA2]" />
          )}
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-[160px] font-mono text-sm"
          />
        </div>
      </div>

      {/* ═══════════ LOADING ═══════════ */}
      {isLoading ? (
        <div className="bg-white rounded-xl border border-[#E5EAF0] p-12 text-center">
          <Loader2
            size={24}
            className="animate-spin text-[#169BA2] mx-auto mb-3"
          />
          <p className="text-xs text-[#8A9AAA]">Đang tải số liệu...</p>
        </div>
      ) : isError ? (
        <div className="bg-white rounded-xl border border-[#FFCDD2] p-6 flex items-start gap-3">
          <AlertTriangle
            size={16}
            className="text-[#C62828] flex-shrink-0 mt-0.5"
          />
          <div>
            <div className="text-sm font-bold text-[#C62828]">
              Không tải được số liệu
            </div>
            <div className="text-xs text-[#6A7A9A] mt-1">
              {error?.response?.data?.error || error?.message}
            </div>
          </div>
        </div>
      ) : !stats || stats.trip_count?.total === 0 ? (
        <div className="bg-white rounded-xl border border-[#E5EAF0] p-8 text-center">
          <div className="w-14 h-14 rounded-full bg-[#F8FAFC] flex items-center justify-center mx-auto mb-3">
            <Info size={22} className="text-[#B0BCCA]" />
          </div>
          <div className="text-sm font-bold text-[#1A2332] mb-1">
            Không có chuyến nào
          </div>
          <p className="text-xs text-[#8A9AAA] max-w-sm mx-auto">
            {stats?.note ||
              "Ngày này không có lịch chạy hoặc chưa sinh chuyến cho tuyến."}
          </p>
        </div>
      ) : (
        <>
          {/* ═══════════ TỔNG QUAN ═══════════ */}
          <div className="bg-white rounded-xl border border-[#E5EAF0] p-4">
            <div className="flex items-center gap-2 mb-3">
              <BarChart3 size={13} className="text-[#169BA2]" />
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-[#4A5A7A]">
                Tổng quan trong ngày
              </h3>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <StatBox label="Tổng chuyến" value={stats.trip_count.total} />
              <StatBox label="Chiều đi" value={stats.trip_count.go} accent />
              <StatBox
                label="Chiều về"
                value={stats.trip_count.return}
                accent
              />
              <StatBox
                label="Giãn cách TB"
                value={stats.headway?.go?.avg_min ?? "—"}
                suffix="phút"
              />
            </div>

            {/* Khung giờ hoạt động */}
            <div className="flex items-center gap-4 mt-4 pt-4 border-t border-[#E5EAF0]">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-md bg-[#E6F4F5] flex items-center justify-center">
                  <Clock size={12} className="text-[#169BA2]" />
                </div>
                <div>
                  <div className="text-[10px] text-[#8A9AAA] uppercase tracking-wider">
                    Chuyến đầu
                  </div>
                  <div className="text-sm font-bold font-mono text-[#1A2332]">
                    {stats.operating_window?.first_trip || "—"}
                  </div>
                </div>
              </div>

              <ArrowRight size={14} className="text-[#B0BCCA]" />

              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-md bg-[#E6F4F5] flex items-center justify-center">
                  <Clock size={12} className="text-[#169BA2]" />
                </div>
                <div>
                  <div className="text-[10px] text-[#8A9AAA] uppercase tracking-wider">
                    Chuyến cuối
                  </div>
                  <div className="text-sm font-bold font-mono text-[#1A2332]">
                    {stats.operating_window?.last_trip || "—"}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ═══════════ CHI TIẾT GIÃN CÁCH ═══════════ */}
          <div className="bg-white rounded-xl border border-[#E5EAF0] p-4">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp size={13} className="text-[#169BA2]" />
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-[#4A5A7A]">
                Chi tiết giãn cách
              </h3>
            </div>

            <div className="space-y-5">
              {/* GO */}
              {stats.headway?.go && stats.headway.go.count > 0 && (
                <div>
                  <HeadwayTimeline
                    trips={stats.headway.go.details}
                    label="Chiều đi"
                    icon={ArrowRight}
                  />

                  <div className="grid grid-cols-3 gap-2 mt-3">
                    <StatBox
                      label="Min"
                      value={stats.headway.go.min_min}
                      suffix="p"
                    />
                    <StatBox
                      label="Trung bình"
                      value={stats.headway.go.avg_min}
                      suffix="p"
                    />
                    <StatBox
                      label="Max"
                      value={stats.headway.go.max_min}
                      suffix="p"
                    />
                  </div>
                </div>
              )}

              {/* Divider */}
              {stats.headway?.go?.count > 0 &&
                stats.headway?.return?.count > 0 && (
                  <div className="border-t border-dashed border-[#E5EAF0]" />
                )}

              {/* RETURN */}
              {stats.headway?.return && stats.headway.return.count > 0 && (
                <div>
                  <HeadwayTimeline
                    trips={stats.headway.return.details}
                    label="Chiều về"
                    icon={ArrowLeftRight}
                  />

                  <div className="grid grid-cols-3 gap-2 mt-3">
                    <StatBox
                      label="Min"
                      value={stats.headway.return.min_min}
                      suffix="p"
                    />
                    <StatBox
                      label="Trung bình"
                      value={stats.headway.return.avg_min}
                      suffix="p"
                    />
                    <StatBox
                      label="Max"
                      value={stats.headway.return.max_min}
                      suffix="p"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ═══════════ SERVICES ACTIVE ═══════════ */}
          {stats.services_active?.length > 0 && (
            <div className="bg-white rounded-xl border border-[#E5EAF0] p-4">
              <div className="flex items-center gap-2 mb-2">
                <CalendarDays size={13} className="text-[#169BA2]" />
                <h3 className="text-[11px] font-bold uppercase tracking-wider text-[#4A5A7A]">
                  Lịch áp dụng
                </h3>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {stats.services_active.map((svc, i) => (
                  <Badge key={i} variant="info">
                    {svc}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

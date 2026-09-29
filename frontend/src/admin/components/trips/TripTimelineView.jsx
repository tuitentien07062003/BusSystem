// src/admin/components/trips/TripTimelineView.jsx
// Biểu đồ Gantt — hiển thị toàn bộ chuyến trong ngày theo trục thời gian
// Trục Y: Tuyến (route + direction)
// Trục X: Thời gian 05:00 - 22:00
import { useMemo, useState, useRef, useEffect } from "react";
import { ZoomIn, ZoomOut } from "lucide-react";

// ═══════════════════════════════════════════════════════════════
// Constants
// ═══════════════════════════════════════════════════════════════
const HOUR_START = 5; // 05:00
const HOUR_END = 22; // 22:00
const TOTAL_HOURS = HOUR_END - HOUR_START;
const MIN_TICK_MINUTES = 30; // Mỗi vạch = 30 phút

const ROW_HEIGHT = 40;
const BAR_HEIGHT = 22;
const HEADER_HEIGHT = 48;
const LABEL_COL_WIDTH = 180;

// ═══════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════
function timeToMinutes(t) {
  if (!t) return 0;
  const [h, m] = String(t).split(":").map(Number);
  return h * 60 + m;
}

function fmtTime(t) {
  if (!t) return "—";
  return String(t).slice(0, 5);
}

// Tính status chuyến dựa trên giờ hiện tại + thời gian di chuyển
function computeTripStatus(trip, travelTimeSec, isToday, currentMinutes) {
  if (trip.is_active === false) return "cancelled";

  const startMin = timeToMinutes(trip.start_time);
  const durationMin = Math.round((travelTimeSec || 3600) / 60);
  const endMin = startMin + durationMin;

  if (!isToday) return "scheduled";

  if (currentMinutes < startMin) return "scheduled";
  if (currentMinutes >= startMin && currentMinutes < endMin)
    return "in_progress";
  return "completed";
}

// ═══════════════════════════════════════════════════════════════
// Status styles
// ═══════════════════════════════════════════════════════════════
const STATUS_STYLE = {
  scheduled: {
    bg: "#E5EAF0",
    border: "#B0BCCA",
    label: "Chưa chạy",
  },
  in_progress: {
    bg: "#169BA2",
    border: "#0F7075",
    label: "Đang chạy",
  },
  completed: {
    bg: "#2E7D32",
    border: "#1B5E20",
    label: "Hoàn thành",
  },
  delayed: {
    bg: "#E08940",
    border: "#B86A1F",
    label: "Trễ",
  },
  cancelled: {
    bg: "repeating-linear-gradient(45deg, #D0D7E2, #D0D7E2 4px, #E5EAF0 4px, #E5EAF0 8px)",
    border: "#B0BCCA",
    label: "Đã hủy",
  },
};

// ═══════════════════════════════════════════════════════════════
// Sub-component: Trip Bar
// ═══════════════════════════════════════════════════════════════
function TripBar({
  trip,
  travelTimeSec,
  isToday,
  currentMinutes,
  pxPerHour,
  onSelect,
}) {
  const [hover, setHover] = useState(false);

  const startMin = timeToMinutes(trip.start_time);
  const durationMin = Math.round((travelTimeSec || 3600) / 60);
  const endMin = startMin + durationMin;

  // Vị trí tính theo phút (offset từ 05:00)
  const leftPx = ((startMin - HOUR_START * 60) / 60) * pxPerHour;
  const widthPx = Math.max(20, (durationMin / 60) * pxPerHour);

  // Clamp nếu vượt khung
  const isBefore = startMin < HOUR_START * 60;
  const isAfter = endMin > HOUR_END * 60;
  if (isBefore || isAfter) return null;

  const status = computeTripStatus(
    trip,
    travelTimeSec,
    isToday,
    currentMinutes,
  );
  const style = STATUS_STYLE[status];

  return (
    <>
      <button
        type="button"
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        onClick={() => onSelect?.(trip)}
        style={{
          position: "absolute",
          left: `${leftPx}px`,
          top: `${(ROW_HEIGHT - BAR_HEIGHT) / 2}px`,
          width: `${widthPx}px`,
          height: `${BAR_HEIGHT}px`,
          background: style.bg,
          borderColor: style.border,
        }}
        className="rounded border-[1.5px] cursor-pointer transition-all hover:shadow-md hover:z-20 hover:scale-[1.02] flex items-center px-2 overflow-hidden"
      >
        {widthPx > 60 && (
          <span className="text-[10px] font-semibold text-white truncate drop-shadow">
            {fmtTime(trip.start_time)}
          </span>
        )}
      </button>

      {/* Tooltip on hover */}
      {hover && (
        <div
          style={{
            position: "absolute",
            left: `${leftPx + widthPx + 8}px`,
            top: `${(ROW_HEIGHT - BAR_HEIGHT) / 2 - 4}px`,
          }}
          className="z-50 px-3 py-2 rounded-lg bg-[#1A2332] text-white text-[11px] shadow-xl pointer-events-none min-w-[200px] whitespace-nowrap"
        >
          <div className="font-bold text-[12px] mb-1">{trip.trip_id}</div>
          <div className="space-y-0.5 text-[10px] text-white/80">
            <div>
              Tuyến:{" "}
              <span className="text-white font-semibold">
                {trip.route_short_name}
              </span>
            </div>
            <div>
              Hướng:{" "}
              <span className="text-white font-semibold">
                {trip.direction_id === 0 ? "Chiều đi" : "Chiều về"}
              </span>
            </div>
            <div>
              Xuất bến:{" "}
              <span className="text-white font-mono font-semibold">
                {fmtTime(trip.start_time)}
              </span>
            </div>
            <div>
              Kết thúc:{" "}
              <span className="text-white font-mono font-semibold">
                {Math.floor(endMin / 60)}:{String(endMin % 60).padStart(2, "0")}
              </span>
            </div>
            <div className="pt-1 mt-1 border-t border-white/10">
              Trạng thái:{" "}
              <span className="font-semibold" style={{ color: style.border }}>
                {style.label}
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════
export function TripTimelineView({
  trips = [],
  routes = [],
  date,
  onSelectTrip,
}) {
  const [pxPerHour, setPxPerHour] = useState(90);
  const scrollRef = useRef(null);

  // ─── Ngày đang xem có phải hôm nay không ───
  const isToday = useMemo(() => {
    if (!date) return false;
    const today = new Date();
    const p = (n) => String(n).padStart(2, "0");
    const todayStr = `${today.getFullYear()}-${p(today.getMonth() + 1)}-${p(today.getDate())}`;
    return date === todayStr;
  }, [date]);

  // ─── Phút hiện tại ───
  const currentMinutes = useMemo(() => {
    if (!isToday) return -1;
    const now = new Date();
    return now.getHours() * 60 + now.getMinutes();
  }, [isToday]);

  // ─── Group trips theo (route_id + direction_id) ───
  const groups = useMemo(() => {
    const map = new Map();

    trips.forEach((t) => {
      const key = `${t.route_id ?? 0}-${t.direction_id ?? 0}`;
      if (!map.has(key)) {
        map.set(key, {
          key,
          route_id: t.route_id,
          route_code: t.route_code,
          route_short_name: t.route_short_name || "—",
          route_color: t.route_color,
          direction_id: t.direction_id,
          trips: [],
        });
      }
      map.get(key).trips.push(t);
    });

    // Sort theo route_short_name, direction
    const arr = Array.from(map.values());
    arr.sort((a, b) => {
      const n = (a.route_short_name || "").localeCompare(
        b.route_short_name || "",
      );
      if (n !== 0) return n;
      return (a.direction_id ?? 0) - (b.direction_id ?? 0);
    });

    // Sort trips trong mỗi group theo start_time
    arr.forEach((g) => {
      g.trips.sort((a, b) =>
        String(a.start_time).localeCompare(String(b.start_time)),
      );
    });

    return arr;
  }, [trips]);

  // ─── Số giờ & tổng width ───
  const totalWidth = TOTAL_HOURS * pxPerHour;

  // ─── Vạch giờ (mỗi 30 phút) ───
  const ticks = [];
  for (let m = HOUR_START * 60; m <= HOUR_END * 60; m += MIN_TICK_MINUTES) {
    const leftPx = ((m - HOUR_START * 60) / 60) * pxPerHour;
    const h = Math.floor(m / 60);
    const mm = m % 60;
    const isHour = mm === 0;
    ticks.push({
      key: m,
      leftPx,
      label: `${String(h).padStart(2, "0")}:${String(mm).padStart(2, "0")}`,
      isHour,
    });
  }

  // ─── Auto scroll đến giờ hiện tại ───
  useEffect(() => {
    if (!scrollRef.current || currentMinutes < 0) return;
    const leftPx = ((currentMinutes - HOUR_START * 60) / 60) * pxPerHour;
    if (leftPx > 0 && leftPx < totalWidth) {
      scrollRef.current.scrollLeft = Math.max(0, leftPx - 200);
    }
  }, [currentMinutes, pxPerHour, totalWidth]);

  // ─── Vị trí đường "now" ───
  const nowPx =
    currentMinutes >= HOUR_START * 60 && currentMinutes <= HOUR_END * 60
      ? ((currentMinutes - HOUR_START * 60) / 60) * pxPerHour
      : null;

  // ═══════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════
  if (groups.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-[#E5EAF0] py-16 text-center">
        <div className="text-sm font-semibold text-[#1A2332] mb-1">
          Không có chuyến nào
        </div>
        <div className="text-xs text-[#8A9AAA]">
          Chọn ngày khác hoặc sinh chuyến cho tuyến
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-[#E5EAF0] overflow-hidden">
      {/* ═══════════ HEADER TOOLBAR ═══════════ */}
      <div className="flex items-center justify-between gap-2 px-4 py-2 border-b border-[#E5EAF0]">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-[#6A7A9A]">
          Biểu đồ chuyến trong ngày
        </div>

        {/* Zoom controls */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setPxPerHour((v) => Math.max(50, v - 20))}
            title="Thu nhỏ"
            className="w-7 h-7 rounded-md border border-[#D0D7E2] bg-white hover:bg-[#F8FAFC] flex items-center justify-center cursor-pointer"
          >
            <ZoomOut size={12} className="text-[#6A7A9A]" />
          </button>
          <span className="text-[10px] font-mono text-[#8A9AAA] min-w-[38px] text-center">
            {pxPerHour}px/h
          </span>
          <button
            type="button"
            onClick={() => setPxPerHour((v) => Math.min(200, v + 20))}
            title="Phóng to"
            className="w-7 h-7 rounded-md border border-[#D0D7E2] bg-white hover:bg-[#F8FAFC] flex items-center justify-center cursor-pointer"
          >
            <ZoomIn size={12} className="text-[#6A7A9A]" />
          </button>
        </div>
      </div>

      {/* ═══════════ TIMELINE ═══════════ */}
      <div className="flex overflow-hidden">
        {/* ─── Left: Fixed labels column ─── */}
        <div
          className="flex-shrink-0 bg-[#F8FAFC] border-r border-[#E5EAF0] z-10"
          style={{ width: LABEL_COL_WIDTH }}
        >
          {/* Header cell */}
          <div
            className="flex items-center px-3 border-b border-[#E5EAF0]"
            style={{ height: HEADER_HEIGHT }}
          >
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8A9AAA]">
              Tuyến / Hướng
            </span>
          </div>

          {/* Row labels */}
          {groups.map((g) => (
            <div
              key={g.key}
              className="flex items-center gap-2 px-3 border-b border-[#E5EAF0] bg-white"
              style={{ height: ROW_HEIGHT }}
            >
              <span
                className="w-1 h-5 rounded-full flex-shrink-0"
                style={{ background: g.route_color || "#169BA2" }}
              />
              <div className="min-w-0 flex-1">
                <div className="text-[12px] font-bold text-[#1A2332] truncate leading-tight">
                  {g.route_short_name}
                </div>
                <div className="text-[9px] text-[#8A9AAA] uppercase tracking-wider leading-tight">
                  {g.direction_id === 0 ? "Chiều đi" : "Chiều về"}
                </div>
              </div>
              <span className="text-[10px] font-mono text-[#6A7A9A] flex-shrink-0">
                {g.trips.length}
              </span>
            </div>
          ))}
        </div>

        {/* ─── Right: Scrollable timeline ─── */}
        <div ref={scrollRef} className="flex-1 overflow-x-auto">
          <div style={{ width: totalWidth, position: "relative" }}>
            {/* ═══════ Header: Time ticks ═══════ */}
            <div
              className="relative border-b border-[#E5EAF0] bg-[#F8FAFC]"
              style={{ height: HEADER_HEIGHT }}
            >
              {ticks.map((t) => (
                <div
                  key={t.key}
                  style={{
                    position: "absolute",
                    left: t.leftPx,
                    top: 0,
                    bottom: 0,
                  }}
                  className="flex flex-col items-center justify-end"
                >
                  <div
                    className={`w-px ${t.isHour ? "bg-[#B0BCCA]" : "bg-[#E5EAF0]"}`}
                    style={{ height: t.isHour ? "20px" : "12px" }}
                  />
                  {t.isHour && (
                    <span className="text-[10px] font-mono font-semibold text-[#6A7A9A] mt-1">
                      {t.label}
                    </span>
                  )}
                </div>
              ))}

              {/* Đường "now" ở header */}
              {nowPx != null && (
                <div
                  style={{
                    position: "absolute",
                    left: nowPx,
                    top: 0,
                    bottom: 0,
                    width: 2,
                  }}
                  className="bg-red-500 z-30"
                >
                  <div className="absolute -top-0.5 -left-[3px] w-2 h-2 rounded-full bg-red-500" />
                </div>
              )}
            </div>

            {/* ═══════ Body: Rows of trip bars ═══════ */}
            <div className="relative">
              {/* Grid background (vertical lines) */}
              {ticks.map((t) => (
                <div
                  key={`grid-${t.key}`}
                  style={{
                    position: "absolute",
                    left: t.leftPx,
                    top: 0,
                    bottom: 0,
                    width: 1,
                  }}
                  className={t.isHour ? "bg-[#E5EAF0]" : "bg-[#F0F3F7]"}
                />
              ))}

              {/* Đường "now" xuyên suốt body */}
              {nowPx != null && (
                <div
                  style={{
                    position: "absolute",
                    left: nowPx,
                    top: 0,
                    bottom: 0,
                    width: 2,
                  }}
                  className="bg-red-500/60 z-10 pointer-events-none"
                />
              )}

              {/* Rows */}
              {groups.map((g) => (
                <div
                  key={g.key}
                  className="relative border-b border-[#F0F3F7]"
                  style={{ height: ROW_HEIGHT }}
                >
                  {g.trips.map((t) => (
                    <TripBar
                      key={t.id}
                      trip={t}
                      travelTimeSec={t.travel_time_sec}
                      isToday={isToday}
                      currentMinutes={currentMinutes}
                      pxPerHour={pxPerHour}
                      onSelect={onSelectTrip}
                    />
                  ))}
                </div>
              ))}
            </div>

            {/* ═══════ Footer: Legend ═══════ */}
            <div className="flex items-center gap-4 px-4 py-3 border-t border-[#E5EAF0] bg-[#F8FAFC] text-[10px]">
              {[
                { status: "scheduled", label: "Chưa chạy" },
                { status: "in_progress", label: "Đang chạy" },
                { status: "completed", label: "Hoàn thành" },
                { status: "cancelled", label: "Đã hủy" },
              ].map((item) => {
                const st = STATUS_STYLE[item.status];
                return (
                  <div key={item.status} className="flex items-center gap-1.5">
                    <span
                      className="w-3 h-3 rounded border"
                      style={{
                        background: st.bg,
                        borderColor: st.border,
                      }}
                    />
                    <span className="text-[#6A7A9A] font-medium">
                      {item.label}
                    </span>
                  </div>
                );
              })}

              {isToday && (
                <div className="flex items-center gap-1.5 ml-2 pl-4 border-l border-[#E5EAF0]">
                  <span className="w-3 h-0.5 bg-red-500 rounded" />
                  <span className="text-red-600 font-semibold">Hiện tại</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

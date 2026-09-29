import { useEffect, useState, useRef, useMemo } from "react";
import {
  X,
  Loader2,
  ToggleLeft,
  ToggleRight,
  MapPin,
  ListOrdered,
  Clock,
} from "lucide-react";
import L from "leaflet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useChangeTripStatus } from "@/hooks/useTrips";
import { useRouteOperations } from "@/hooks/useRouteOperations";

// ═══════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════
function fmtTime(t) {
  if (!t) return "—";
  return String(t).slice(0, 5);
}

function addSecondsToTime(timeStr, sec) {
  if (!timeStr) return "—";
  const [h, m, s = 0] = String(timeStr).split(":").map(Number);
  let total = h * 3600 + m * 60 + s + sec;
  const hh = Math.floor(total / 3600) % 24;
  const mm = Math.floor((total % 3600) / 60);
  const p = (n) => String(n).padStart(2, "0");
  return `${p(hh)}:${p(mm)}`;
}

function fmtOffset(sec) {
  if (sec == null) return "—";
  const m = Math.floor(sec / 60);
  return `+${m}p`;
}

// ═══════════════════════════════════════════════════════════════
// TAB 1: Lịch trình trạm dừng
// ═══════════════════════════════════════════════════════════════
function TimetableTab({ trip, stopTimes, isLoading }) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 size={20} className="animate-spin text-[#169BA2]" />
      </div>
    );
  }

  if (!stopTimes || stopTimes.length === 0) {
    return (
      <div className="py-12 text-center text-xs text-[#8A9AAA]">
        Không có lịch trình trạm dừng cho chuyến này
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {/* ─── Header ─── */}
      <div className="grid grid-cols-[40px_1fr_70px_70px] gap-2 px-4 py-2 bg-[#F8FAFC] border-b border-[#E5EAF0] text-[10px] font-bold uppercase tracking-wider text-[#8A9AAA] sticky top-0 z-10">
        <div className="text-center">#</div>
        <div>Trạm dừng</div>
        <div className="text-right">Đến</div>
        <div className="text-right">Đi</div>
      </div>

      {/* ─── Rows ─── */}
      {stopTimes.map((st, idx) => {
        const isDepot = st.stop?.stop_type === 1;
        const arrivalTime = addSecondsToTime(
          trip.start_time,
          st.arrival_offset_seconds,
        );
        const departureTime = addSecondsToTime(
          trip.start_time,
          st.departure_offset_seconds,
        );

        return (
          <div
            key={st.id ?? idx}
            className="grid grid-cols-[40px_1fr_70px_70px] gap-2 px-4 py-2.5 border-b border-[#F0F3F7] last:border-b-0 hover:bg-[#F8FAFC] items-center"
          >
            {/* Số thứ tự */}
            <div className="flex justify-center">
              <span
                className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  isDepot
                    ? "bg-[#169BA2] text-white"
                    : "bg-[#E6F4F5] text-[#169BA2]"
                }`}
              >
                {st.stop_sequence}
              </span>
            </div>

            {/* Tên trạm */}
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-[#1A2332] truncate">
                  {st.stop?.stop_name || st.stop_name || `Trạm #${st.stop_id}`}
                </span>
                {isDepot && (
                  <Badge variant="info" className="text-[9px] flex-shrink-0">
                    Depot
                  </Badge>
                )}
              </div>
              <div className="text-[10px] text-[#8A9AAA] font-mono">
                {st.stop?.stop_id || st.stop_id || "—"}
              </div>
            </div>

            {/* Giờ đến */}
            <div className="text-right">
              <div className="text-xs font-bold text-[#1A2332] font-mono">
                {arrivalTime}
              </div>
              <div className="text-[9px] text-[#8A9AAA]">
                {fmtOffset(st.arrival_offset_seconds)}
              </div>
            </div>

            {/* Giờ đi */}
            <div className="text-right">
              <div className="text-xs font-bold text-[#1A2332] font-mono">
                {departureTime}
              </div>
              <div className="text-[9px] text-[#8A9AAA]">
                {fmtOffset(st.departure_offset_seconds)}
              </div>
            </div>
          </div>
        );
      })}

      {/* ─── Summary ─── */}
      <div className="px-4 py-3 bg-[#F8FAFC] border-t border-[#E5EAF0] flex items-center justify-between text-[10px]">
        <span className="text-[#8A9AAA]">
          Tổng: <b className="text-[#1A2332]">{stopTimes.length}</b> trạm
        </span>
        <span className="text-[#8A9AAA] font-mono">
          {fmtTime(trip.start_time)} →{" "}
          {stopTimes.length > 0
            ? addSecondsToTime(
                trip.start_time,
                stopTimes[stopTimes.length - 1].departure_offset_seconds,
              )
            : "—"}
        </span>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// TAB 2: Bản đồ lộ trình
// ═══════════════════════════════════════════════════════════════
function RouteMapTab({ shape, stops, isLoading }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const layersRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    if (isLoading || !shape) return;

    const map = L.map(containerRef.current, {
      zoomControl: true,
      attributionControl: false,
    }).setView([10.82, 106.74], 13);

    L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
      { subdomains: "abcd", maxZoom: 19 },
    ).addTo(map);

    const routeLayer = L.geoJSON(shape, {
      style: { color: "#169BA2", weight: 5, opacity: 0.85 },
    }).addTo(map);

    // Vẽ stops
    const stopMarkers = [];
    (stops || []).forEach((s) => {
      if (!s.latitude || !s.longitude) return;
      const isDepot = s.stop_type === 1;
      const m = L.circleMarker([s.latitude, s.longitude], {
        radius: isDepot ? 7 : 5,
        color: isDepot ? "#E08940" : "#169BA2",
        fillColor: "#fff",
        fillOpacity: 1,
        weight: 2,
      })
        .addTo(map)
        .bindPopup(
          `<div class="bus-popup"><b>${s.stop_name || "Trạm"}</b></div>`,
        );
      stopMarkers.push(m);
    });

    map.fitBounds(routeLayer.getBounds(), { padding: [30, 30] });

    mapRef.current = map;
    layersRef.current = { routeLayer, stopMarkers };

    return () => {
      map.remove();
      mapRef.current = null;
      layersRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shape, stops, isLoading]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 size={20} className="animate-spin text-[#169BA2]" />
      </div>
    );
  }

  if (!shape) {
    return (
      <div className="py-12 text-center text-xs text-[#8A9AAA]">
        Không có dữ liệu lộ trình cho chuyến này
      </div>
    );
  }

  return (
    <div className="h-full">
      <div ref={containerRef} className="w-full h-full" />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// MAIN DRAWER
// ═══════════════════════════════════════════════════════════════
export function TripDetailDrawer({
  trip,
  open,
  onClose,
  stopTimes = [],
  routeShape = null,
  routeStops = [],
  isLoadingStops = false,
  isLoadingShape = false,
}) {
  const [tab, setTab] = useState("timetable");
  const statusMut = useChangeTripStatus();

  // Reset tab khi mở
  useEffect(() => {
    if (open) setTab("timetable");
  }, [open, trip?.id]);

  // Đóng khi nhấn ESC
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // Tính thời lượng chuyến
  const travelTimeSec = useMemo(() => {
    if (!stopTimes || stopTimes.length === 0) return null;
    const last = stopTimes[stopTimes.length - 1];
    return last.arrival_offset_seconds;
  }, [stopTimes]);

  if (!open || !trip) return null;

  const isActive = trip.is_active !== false;

  const toggleStatus = () => {
    statusMut.mutate({ id: trip.id, is_active: !isActive });
  };

  const arrivalEndTime = travelTimeSec
    ? addSecondsToTime(trip.start_time, travelTimeSec)
    : "—";

  return (
    <>
      {/* ═══════════ OVERLAY ═══════════ */}
      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-[1px] z-[1000] animate-in fade-in"
        onClick={onClose}
      />

      {/* ═══════════ DRAWER ═══════════ */}
      <div
        className="fixed top-0 right-0 h-screen w-full max-w-[640px] bg-white shadow-2xl z-[1010] flex flex-col animate-in slide-in-from-right"
        style={{ animationDuration: "0.25s" }}
      >
        {/* ═══════ HEADER ═══════ */}
        <header className="flex-shrink-0 border-b border-[#E5EAF0] bg-white">
          <div className="flex items-start gap-3 px-5 py-4">
            {/* Left: Title */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span
                  className="w-1 h-5 rounded-full flex-shrink-0"
                  style={{ background: trip.route_color || "#169BA2" }}
                />
                <h2 className="text-base font-bold text-[#1A2332] font-mono truncate">
                  {trip.trip_id}
                </h2>
              </div>
              <div className="flex items-center gap-2 text-xs text-[#6A7A9A] ml-3">
                <span className="font-semibold text-[#169BA2]">
                  {trip.route_short_name}
                </span>
                <span>·</span>
                <span>{trip.direction_id === 0 ? "Chiều đi" : "Chiều về"}</span>
                <span>·</span>
                <span className="font-mono">{fmtTime(trip.start_time)}</span>
              </div>
            </div>

            {/* Right: Toggle + Close */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                type="button"
                onClick={toggleStatus}
                disabled={statusMut.isPending}
                title={isActive ? "Tắt chuyến" : "Bật chuyến"}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[11px] font-semibold border transition-all cursor-pointer disabled:opacity-50 ${
                  isActive
                    ? "bg-[#F1F8F1] text-[#2E7D32] border-[#A8D5A8] hover:bg-[#E0F0E0]"
                    : "bg-[#F8FAFC] text-[#6A7A9A] border-[#E5EAF0] hover:bg-[#EEF2F6]"
                }`}
              >
                {statusMut.isPending ? (
                  <Loader2 size={12} className="animate-spin" />
                ) : isActive ? (
                  <ToggleRight size={14} />
                ) : (
                  <ToggleLeft size={14} />
                )}
                {isActive ? "Đang hoạt động" : "Đã tắt"}
              </button>

              <button
                type="button"
                onClick={onClose}
                title="Đóng"
                className="w-8 h-8 rounded-md hover:bg-[#F8FAFC] flex items-center justify-center cursor-pointer transition-colors"
              >
                <X size={16} className="text-[#6A7A9A]" />
              </button>
            </div>
          </div>

          {/* ═══════ META ROW ═══════ */}
          <div className="grid grid-cols-3 gap-3 px-5 pb-4">
            <div className="rounded-lg bg-[#F8FAFC] border border-[#E5EAF0] px-3 py-2">
              <div className="text-[9px] font-bold uppercase tracking-wider text-[#8A9AAA] mb-0.5">
                Biển hiệu
              </div>
              <div className="text-xs font-semibold text-[#1A2332] truncate">
                {trip.trip_headsign || "—"}
              </div>
            </div>

            <div className="rounded-lg bg-[#F8FAFC] border border-[#E5EAF0] px-3 py-2">
              <div className="text-[9px] font-bold uppercase tracking-wider text-[#8A9AAA] mb-0.5">
                Lịch áp dụng
              </div>
              <div className="text-xs font-semibold text-[#1A2332] truncate">
                {trip.service_code || "—"}
              </div>
            </div>

            <div className="rounded-lg bg-[#F8FAFC] border border-[#E5EAF0] px-3 py-2">
              <div className="text-[9px] font-bold uppercase tracking-wider text-[#8A9AAA] mb-0.5">
                Kết thúc dự kiến
              </div>
              <div className="text-xs font-semibold text-[#1A2332] font-mono">
                {arrivalEndTime}
              </div>
            </div>
          </div>

          {/* ═══════ TABS ═══════ */}
          <div className="flex border-t border-[#E5EAF0]">
            <button
              type="button"
              onClick={() => setTab("timetable")}
              className={`flex-1 inline-flex items-center justify-center gap-1.5 py-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
                tab === "timetable"
                  ? "text-[#169BA2] border-[#169BA2] bg-[#F0F9FA]"
                  : "text-[#6A7A9A] border-transparent hover:text-[#1A2332] hover:bg-[#F8FAFC]"
              }`}
            >
              <ListOrdered size={13} />
              Lịch trình trạm dừng
            </button>
            <button
              type="button"
              onClick={() => setTab("map")}
              className={`flex-1 inline-flex items-center justify-center gap-1.5 py-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
                tab === "map"
                  ? "text-[#169BA2] border-[#169BA2] bg-[#F0F9FA]"
                  : "text-[#6A7A9A] border-transparent hover:text-[#1A2332] hover:bg-[#F8FAFC]"
              }`}
            >
              <MapPin size={13} />
              Bản đồ lộ trình
            </button>
          </div>
        </header>

        {/* ═══════ BODY ═══════ */}
        <div className="flex-1 overflow-hidden">
          {tab === "timetable" ? (
            <div className="h-full overflow-y-auto scrollbar-thin">
              <TimetableTab
                trip={trip}
                stopTimes={stopTimes}
                isLoading={isLoadingStops}
              />
            </div>
          ) : (
            <RouteMapTab
              shape={routeShape}
              stops={routeStops}
              isLoading={isLoadingShape}
            />
          )}
        </div>
      </div>
    </>
  );
}

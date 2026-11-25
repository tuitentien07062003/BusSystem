import { useState, useEffect, useRef } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import {
  ChevronLeft,
  Clock,
  Ticket,
  Info,
  ListOrdered,
  BarChart3,
  MapPin,
} from "lucide-react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { getRouteDetail, getRouteSchedule } from "../api/discoveryApi";
import { useAuth } from "../hooks/useAuth";
import { FavoriteHeartButton } from "../components/favorites/FavoriteHeartButton";

function RouteMap({ shape, stops }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);

  useEffect(() => {
    if (!mapRef.current || !shape) return;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
    }

    const map = L.map(mapRef.current, { zoomControl: true }).setView(
      [10.82, 106.74],
      13,
    );

    L.tileLayer(
      "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}",
      {
        attribution: "© OpenStreetMap © CARTO",
        subdomains: "abcd",
        maxZoom: 19,
      },
    ).addTo(map);

    const routeLayer = L.geoJSON(shape, {
      style: { color: "#169BA2", weight: 5, opacity: 0.8 },
    }).addTo(map);

    stops.forEach((stop, idx) => {
      const isFirst = idx === 0;
      const isLast = idx === stops.length - 1;

      L.circleMarker([stop.latitude, stop.longitude], {
        radius: isFirst || isLast ? 8 : 5,
        color: isFirst || isLast ? "#E08940" : "#169BA2",
        fillColor: "#FFFFFF",
        fillOpacity: 1,
        weight: 2,
      })
        .addTo(map)
        .bindPopup(`<b>${stop.name}</b><br/>Trạm ${idx + 1}`);
    });

    map.fitBounds(routeLayer.getBounds(), { padding: [30, 30] });

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [shape, stops]);

  return <div ref={mapRef} className="w-full h-full min-h-[300px] z-0" />;
}

export function RouteDetailPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const fromStopId = searchParams.get("from");
  const toStopId = searchParams.get("to");

  const [routeData, setRouteData] = useState(null);
  const [schedule, setSchedule] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const [activeDir, setActiveDir] = useState(0);
  const [activeSubTab, setActiveSubTab] = useState("stops");

  useEffect(() => {
    Promise.all([
      getRouteDetail(id),
      getRouteSchedule(id, new Date().toISOString().slice(0, 10)),
    ])
      .then(([resDetail, resSchedule]) => {
        setRouteData(resDetail);
        setSchedule(resSchedule);
      })
      .catch((err) => console.error(err))
      .finally(() => setIsLoading(false));
  }, [id]);

  if (isLoading || !routeData) {
    return (
      <div className="p-10 text-center text-[#8A9AAA]">
        Đang tải chi tiết tuyến...
      </div>
    );
  }

  const patterns = routeData.patterns || [];
  const currentPattern = patterns[activeDir] || patterns[0];

  const handleBuyTicket = () => {
    if (!isAuthenticated) {
      navigate("/passenger/login", {
        state: { from: { pathname: `/passenger/tickets` } },
      });
    } else {
      navigate("/passenger/tickets");
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-full md:h-screen bg-white overflow-y-auto md:overflow-hidden pb-16 md:pb-0">
      <div className="w-full md:w-[420px] flex flex-col border-r border-[#E5EAF0] md:h-full shrink-0 bg-white z-10 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
        <div className="flex items-center h-14 px-2 border-b border-[#E5EAF0]">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full hover:bg-[#F0F3F7] flex items-center justify-center transition-colors"
          >
            <ChevronLeft size={22} className="text-[#4A5A7A]" />
          </button>
          <div className="flex-1 px-2">
            <div className="text-base font-bold text-[#1A2332] truncate">
              Tuyến số {routeData.route.short_name}
            </div>
          </div>
          <FavoriteHeartButton routeId={parseInt(id)} size="md" />
        </div>

        <div className="p-3 bg-white border-b border-[#E5EAF0]">
          <button
            onClick={handleBuyTicket}
            className="w-full h-10 rounded-xl bg-[#169BA2] text-white font-bold text-sm hover:bg-[#0F7075] transition-colors flex items-center justify-center gap-2 shadow-sm"
          >
            <Ticket size={18} />
            Mua vé điện tử
          </button>
        </div>

        <div className="flex border-b border-[#E5EAF0]">
          {patterns.map((p, idx) => (
            <button
              key={idx}
              onClick={() => setActiveDir(idx)}
              className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors ${
                activeDir === idx
                  ? "border-[#169BA2] text-[#169BA2] bg-[#F0F9FA]"
                  : "border-transparent text-[#6A7A9A] hover:text-[#1A2332]"
              }`}
            >
              Xem lượt {p.direction_id === 0 ? "đi" : "về"}
            </button>
          ))}
        </div>

        <div className="flex bg-[#F8FAFC] border-b border-[#E5EAF0]">
          <button
            onClick={() => setActiveSubTab("schedule")}
            className={`flex-1 py-3 text-xs font-semibold flex items-center justify-center gap-1.5 border-b-2 transition-colors ${activeSubTab === "schedule" ? "border-[#1A2332] text-[#1A2332] bg-white" : "border-transparent text-[#8A9AAA] hover:text-[#4A5A7A]"}`}
          >
            <BarChart3 size={14} /> Biểu đồ giờ
          </button>
          <button
            onClick={() => setActiveSubTab("stops")}
            className={`flex-1 py-3 text-xs font-semibold flex items-center justify-center gap-1.5 border-b-2 transition-colors ${activeSubTab === "stops" ? "border-[#1A2332] text-[#1A2332] bg-white" : "border-transparent text-[#8A9AAA] hover:text-[#4A5A7A]"}`}
          >
            <ListOrdered size={14} /> Trạm dừng
          </button>
          <button
            onClick={() => setActiveSubTab("info")}
            className={`flex-1 py-3 text-xs font-semibold flex items-center justify-center gap-1.5 border-b-2 transition-colors ${activeSubTab === "info" ? "border-[#1A2332] text-[#1A2332] bg-white" : "border-transparent text-[#8A9AAA] hover:text-[#4A5A7A]"}`}
          >
            <Info size={14} /> Thông tin
          </button>
        </div>

        <div className="flex-1 overflow-y-auto bg-white">
          {activeSubTab === "stops" && (
            <div className="relative py-4">
              {currentPattern?.stops?.map((stop, idx) => {
                const isFirst = idx === 0;
                const isLast = idx === currentPattern.stops.length - 1;
                const isHighlightFrom =
                  fromStopId && String(stop.id) === String(fromStopId);
                const isHighlightTo =
                  toStopId && String(stop.id) === String(toStopId);

                return (
                  <div
                    key={stop.id}
                    className={`flex px-4 py-3 ${isHighlightFrom || isHighlightTo ? "bg-[#F0F9FA]" : ""}`}
                  >
                    <div className="w-8 flex flex-col items-center mr-3">
                      <div
                        className={`w-3.5 h-3.5 rounded-full border-2 flex-shrink-0 z-10 ${
                          isFirst || isLast
                            ? "border-[#E08940] bg-[#E08940]"
                            : "border-[#169BA2] bg-white"
                        }`}
                      />
                      {!isLast && (
                        <div className="w-px flex-1 bg-[#E5EAF0] min-h-[30px] -my-1" />
                      )}
                    </div>

                    <div className="flex-1 pb-2">
                      <div
                        className={`text-sm ${isHighlightFrom || isHighlightTo ? "font-bold text-[#169BA2]" : "font-medium text-[#1A2332]"}`}
                      >
                        {stop.name}
                      </div>
                      <div className="text-xs text-[#8A9AAA] font-mono mt-1">
                        {stop.arrival_offset_sec != null
                          ? `${String(Math.floor(stop.arrival_offset_sec / 3600)).padStart(2, "0")}:${String(Math.floor((stop.arrival_offset_sec % 3600) / 60)).padStart(2, "0")}`
                          : `Trạm ${idx + 1}`}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {activeSubTab === "info" && (
            <div className="p-5 space-y-4">
              <div className="bg-[#F8FAFC] p-4 rounded-xl border border-[#E5EAF0] flex items-start gap-3">
                <Clock className="text-[#169BA2] mt-0.5" size={20} />
                <div>
                  <div className="text-sm font-bold text-[#1A2332]">
                    Giờ hoạt động
                  </div>
                  <div className="text-sm text-[#4A5A7A] mt-1">
                    {schedule?.operating_window?.first_trip || "--:--"} -{" "}
                    {schedule?.operating_window?.last_trip || "--:--"}
                  </div>
                </div>
              </div>

              <div className="bg-[#F8FAFC] p-4 rounded-xl border border-[#E5EAF0] flex items-start gap-3">
                <Ticket className="text-[#E08940] mt-0.5" size={20} />
                <div>
                  <div className="text-sm font-bold text-[#1A2332]">
                    Giá vé lượt
                  </div>
                  <div className="text-sm text-[#4A5A7A] mt-1">
                    7.000 đ (Học sinh/Sinh viên: 3.500 đ)
                  </div>
                </div>
              </div>

              <div className="bg-[#F8FAFC] p-4 rounded-xl border border-[#E5EAF0] flex items-start gap-3">
                <MapPin className="text-[#9333EA] mt-0.5" size={20} />
                <div>
                  <div className="text-sm font-bold text-[#1A2332]">
                    Tổng số trạm
                  </div>
                  <div className="text-sm text-[#4A5A7A] mt-1">
                    {currentPattern?.stops?.length || 0} trạm
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeSubTab === "schedule" && (
            <div className="p-5 text-center text-sm text-[#8A9AAA]">
              Biểu đồ giờ đang được cập nhật...
            </div>
          )}
        </div>
      </div>

      <div className="w-full h-[350px] md:h-full md:flex-1 relative bg-[#E5EAF0] order-first md:order-last">
        <RouteMap
          shape={currentPattern?.shape}
          stops={currentPattern?.stops || []}
        />
      </div>
    </div>
  );
}

import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Navigation,
  Search,
  Loader2,
  ArrowRight,
  Map as MapIcon,
  List,
  X,
  ChevronRight,
  Clock,
  Bus,
  AlertCircle,
} from "lucide-react";
import {
  getNearbyStops,
  getAllStops,
  searchDirectRoutes,
  searchTransferRoutes,
} from "../api/discoveryApi";
import { StopPickerDialog } from "../components/search/StopPickerDialog";
import { PassengerMap } from "../components/map/PassengerMap";
import { toast } from "sonner";

export function SearchPage() {
  const navigate = useNavigate();
  const [urlParams] = useSearchParams();

  const [userPos, setUserPos] = useState(null);
  const [nearbyStops, setNearbyStops] = useState([]);
  const [isLocating, setIsLocating] = useState(true);

  const [fromStop, setFromStop] = useState(null);
  const [toStop, setToStop] = useState(null);
  const [pickerMode, setPickerMode] = useState(null);

  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState(null);
  const [view, setView] = useState("map");

  useEffect(() => {
    const stopId = urlParams.get("stopId");
    if (stopId) {
      getAllStops()
        .then((res) => {
          const s = (res.data || []).find(
            (x) => String(x.id) === String(stopId),
          );
          if (s) setFromStop(s);
        })
        .catch(() => {});
    }
  }, [urlParams]);

  useEffect(() => {
    if (!navigator.geolocation) {
      setIsLocating(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setUserPos([latitude, longitude]);
        try {
          const res = await getNearbyStops({
            lat: latitude,
            lng: longitude,
            radius: 2000,
            limit: 30,
          });
          setNearbyStops(res.data || []);
        } catch {}
        setIsLocating(false);
      },
      () => setIsLocating(false),
      { timeout: 10000 },
    );
  }, []);

  const handleSearch = async () => {
    if (!fromStop || !toStop) {
      toast.error("Vui lòng chọn điểm đi và điểm đến.");
      return;
    }
    setIsSearching(true);
    setResults(null);
    try {
      const [direct, transfer] = await Promise.all([
        searchDirectRoutes({ from: fromStop.id, to: toStop.id }).catch(() => ({
          data: [],
        })),
        searchTransferRoutes({
          from: fromStop.id,
          to: toStop.id,
          limit: 5,
        }).catch(() => ({ data: [] })),
      ]);
      setResults({
        direct: direct.data || [],
        transfer: transfer.data || [],
      });
      setView("list");
    } catch (err) {
      toast.error(err?.response?.data?.error || "Không tìm được đường.");
    } finally {
      setIsSearching(false);
    }
  };

  const mapCenter = userPos || [10.7769, 106.7009];
  const totalResults =
    (results?.direct?.length || 0) + (results?.transfer?.length || 0);

  return (
    <div className="min-h-screen pb-20">
      <div className="sticky top-0 z-20 bg-white border-b border-[#E5EAF0]">
        <div className="px-5 pt-4 pb-2">
          <h1 className="text-xl font-bold text-[#1A2332]">Tìm đường</h1>
          <p className="text-xs text-[#8A9AAA] mt-0.5">
            Nhập điểm đi và điểm đến để nhận gợi ý lộ trình
          </p>
        </div>

        <div className="px-4 py-3 space-y-2">
          <button
            onClick={() => setPickerMode("from")}
            className="w-full flex items-center gap-3 p-3 rounded-xl bg-[#F8FAFC] hover:bg-[#EEF2F6] transition-colors text-left"
          >
            <div className="w-8 h-8 rounded-full bg-[#169BA2] text-white flex items-center justify-center flex-shrink-0 text-xs font-bold">
              A
            </div>
            <div className="flex-1 min-w-0">
              {fromStop ? (
                <>
                  <div className="text-sm font-bold text-[#1A2332] truncate">
                    {fromStop.name}
                  </div>
                  <div className="text-xs text-[#8A9AAA]">{fromStop.code}</div>
                </>
              ) : (
                <span className="text-sm text-[#8A9AAA]">Chọn điểm đi</span>
              )}
            </div>
            <ChevronRight size={16} className="text-[#B0BCCA]" />
          </button>

          <button
            onClick={() => setPickerMode("to")}
            className="w-full flex items-center gap-3 p-3 rounded-xl bg-[#F8FAFC] hover:bg-[#EEF2F6] transition-colors text-left"
          >
            <div className="w-8 h-8 rounded-full bg-[#C62828] text-white flex items-center justify-center flex-shrink-0 text-xs font-bold">
              B
            </div>
            <div className="flex-1 min-w-0">
              {toStop ? (
                <>
                  <div className="text-sm font-bold text-[#1A2332] truncate">
                    {toStop.name}
                  </div>
                  <div className="text-xs text-[#8A9AAA]">{toStop.code}</div>
                </>
              ) : (
                <span className="text-sm text-[#8A9AAA]">Chọn điểm đến</span>
              )}
            </div>
            <ChevronRight size={16} className="text-[#B0BCCA]" />
          </button>

          <div className="flex gap-2">
            <button
              onClick={handleSearch}
              disabled={isSearching || !fromStop || !toStop}
              className="flex-1 h-11 rounded-xl bg-[#169BA2] text-white font-bold text-sm hover:bg-[#0F7075] disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSearching ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Search size={16} />
              )}
              {isSearching ? "Đang tìm..." : "Tìm đường"}
            </button>
            {(fromStop || toStop || results) && (
              <button
                onClick={() => {
                  setFromStop(null);
                  setToStop(null);
                  setResults(null);
                  setView("map");
                }}
                className="px-3 h-11 rounded-xl border border-[#D0D7E2] text-[#6A7A9A] font-semibold text-sm hover:bg-[#F8FAFC]"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        {results && totalResults > 0 && (
          <div className="px-4 pb-3">
            <div className="inline-flex bg-[#F8FAFC] p-1 rounded-lg border border-[#E5EAF0] w-full">
              <button
                onClick={() => setView("map")}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors flex items-center justify-center gap-1.5 ${
                  view === "map"
                    ? "bg-white text-[#169BA2] shadow-sm"
                    : "text-[#6A7A9A]"
                }`}
              >
                <MapIcon size={14} /> Bản đồ
              </button>
              <button
                onClick={() => setView("list")}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors flex items-center justify-center gap-1.5 ${
                  view === "list"
                    ? "bg-white text-[#169BA2] shadow-sm"
                    : "text-[#6A7A9A]"
                }`}
              >
                <List size={14} /> Danh sách
              </button>
            </div>
          </div>
        )}
      </div>

      {view === "map" && (
        <div className="p-3">
          <PassengerMap
            center={mapCenter}
            userPosition={userPos}
            stops={nearbyStops}
            onStopClick={(s) => {
              if (!fromStop) setFromStop(s);
              else if (!toStop) setToStop(s);
            }}
            height={420}
          />
          {isLocating && (
            <div className="mt-2 text-xs text-[#8A9AAA] flex items-center gap-1">
              <Loader2 size={12} className="animate-spin" /> Đang định vị...
            </div>
          )}
          {!isLocating && !userPos && (
            <div className="mt-2 text-xs text-[#C62828] flex items-center gap-1">
              <AlertCircle size={12} /> Không lấy được vị trí. Bấm trạm để chọn.
            </div>
          )}
          {nearbyStops.length > 0 && !results && (
            <div className="mt-3 text-xs text-[#6A7A9A] leading-relaxed bg-[#F8FAFC] p-3 rounded-xl border border-[#E5EAF0]">
              💡 Bấm vào icon trạm trên bản đồ để chọn <b>điểm đi</b> hoặc{" "}
              <b>điểm đến</b> nhanh
            </div>
          )}
        </div>
      )}

      {view === "list" && results && (
        <div className="p-4 space-y-4">
          {results.direct?.length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-[#1A2332] mb-2 flex items-center gap-2">
                <Bus size={16} className="text-[#169BA2]" />
                Tuyến trực tiếp ({results.direct.length})
              </h3>
              <div className="space-y-2">
                {results.direct.map((r, i) => (
                  <div
                    key={i}
                    onClick={() =>
                      navigate(`/passenger/routes/${r.route_id || r.id}`)
                    }
                    className="p-3 rounded-xl border border-[#E5EAF0] bg-white hover:border-[#169BA2]/40 cursor-pointer transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-lg bg-[#E6F4F5] text-[#0F7075] flex items-center justify-center font-bold text-sm flex-shrink-0">
                        {r.short_name || r.route_short_name || "?"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-bold text-[#1A2332] truncate">
                          {r.full_name || r.route_full_name || "(Chưa có tên)"}
                        </div>
                        <div className="text-xs text-[#8A9AAA] mt-0.5 flex items-center gap-2 flex-wrap">
                          {r.duration_min && (
                            <span className="inline-flex items-center gap-1">
                              <Clock size={11} /> {r.duration_min} phút
                            </span>
                          )}
                          {r.stops_count && <span>{r.stops_count} trạm</span>}
                        </div>
                      </div>
                      <ChevronRight
                        size={16}
                        className="text-[#B0BCCA] flex-shrink-0"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {results.transfer?.length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-[#1A2332] mb-2 flex items-center gap-2">
                <Navigation size={16} className="text-[#B45309]" />
                Cần chuyển tuyến ({results.transfer.length})
              </h3>
              <div className="space-y-2">
                {results.transfer.map((t, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-xl border border-[#E5EAF0] bg-white"
                  >
                    <div className="flex items-center gap-2 text-xs font-semibold text-[#1A2332] mb-2 flex-wrap">
                      <span className="px-2 py-0.5 rounded bg-[#E6F4F5] text-[#0F7075]">
                        {t.legs?.[0]?.route_short_name ||
                          t.route1_short_name ||
                          "?"}
                      </span>
                      <ArrowRight size={12} className="text-[#8A9AAA]" />
                      <span className="px-2 py-0.5 rounded bg-[#FEF3E2] text-[#B45309]">
                        {t.legs?.[1]?.route_short_name ||
                          t.route2_short_name ||
                          "?"}
                      </span>
                    </div>
                    <div className="text-xs text-[#6A7A9A]">
                      Chuyển tại:{" "}
                      <span className="font-semibold text-[#1A2332]">
                        {t.transfer_stop_name || t.transfer_stop?.name || "N/A"}
                      </span>
                    </div>
                    {t.duration_min && (
                      <div className="text-xs text-[#8A9AAA] mt-1 flex items-center gap-1">
                        <Clock size={11} /> ~{t.duration_min} phút
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {totalResults === 0 && (
            <div className="text-center py-12">
              <AlertCircle size={32} className="mx-auto mb-2 text-[#B0BCCA]" />
              <p className="text-sm text-[#8A9AAA]">
                Không tìm thấy lộ trình phù hợp.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Loader2, Bus, Clock, X, AlertCircle } from "lucide-react";
import { getMapNetwork } from "../api/discoveryApi";
import { FavoriteHeartButton } from "../components/favorites/FavoriteHeartButton";

export function RoutesListPage() {
  const navigate = useNavigate();
  const [routes, setRoutes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [keyword, setKeyword] = useState("");

  useEffect(() => {
    setIsLoading(true);
    getMapNetwork()
      .then((res) => {
        const list = (res.network || [])
          .map((n) => n.route)
          .filter(Boolean)
          .sort((a, b) =>
            String(a.short_name || "").localeCompare(
              String(b.short_name || ""),
              undefined,
              { numeric: true },
            ),
          );
        setRoutes(list);
      })
      .catch((err) =>
        setError(err?.message || "Không tải được danh sách tuyến."),
      )
      .finally(() => setIsLoading(false));
  }, []);

  const filtered = useMemo(() => {
    if (!keyword.trim()) return routes;
    const kw = keyword.trim().toLowerCase();
    return routes.filter(
      (r) =>
        (r.short_name || "").toLowerCase().includes(kw) ||
        (r.full_name || "").toLowerCase().includes(kw),
    );
  }, [routes, keyword]);

  const grouped = useMemo(() => {
    const map = {};
    filtered.forEach((r) => {
      const key = String(r.short_name || "#")[0].toUpperCase();
      if (!map[key]) map[key] = [];
      map[key].push(r);
    });
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b));
  }, [filtered]);

  return (
    <div className="min-h-screen pb-20">
      <div className="sticky top-0 z-30 bg-white border-b border-[#E5EAF0]">
        <div className="px-5 pt-4 pb-2">
          <h1 className="text-xl font-bold text-[#1A2332]">Tuyến xe buýt</h1>
          <p className="text-xs text-[#8A9AAA] mt-0.5">
            {routes.length} tuyến đang hoạt động
          </p>
        </div>
        <div className="px-5 pb-3">
          <div className="relative">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8A9AAA]"
            />
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Tìm số tuyến hoặc tên tuyến..."
              className="w-full h-10 pl-9 pr-9 rounded-xl border border-[#D0D7E2] bg-[#F8FAFC] text-sm outline-none focus:bg-white focus:border-[#169BA2]"
            />
            {keyword && (
              <button
                onClick={() => setKeyword("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-[#E5EAF0]"
              >
                <X size={14} className="text-[#6A7A9A]" />
              </button>
            )}
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 size={24} className="animate-spin text-[#169BA2] mb-2" />
          <p className="text-sm text-[#8A9AAA]">Đang tải danh sách tuyến...</p>
        </div>
      ) : error ? (
        <div className="text-center py-16 px-6">
          <AlertCircle size={32} className="mx-auto mb-2 text-[#C62828]" />
          <p className="text-sm text-[#C62828]">{error}</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 px-6">
          <Bus size={32} className="mx-auto mb-2 text-[#B0BCCA]" />
          <p className="text-sm text-[#8A9AAA]">Không tìm thấy tuyến nào.</p>
        </div>
      ) : (
        <div>
          {grouped.map(([letter, group]) => (
            <div key={letter}>
              <div className="px-5 py-1.5 bg-[#F8FAFC] text-[10px] font-bold text-[#6A7A9A] uppercase tracking-wider border-b border-[#F0F3F7]">
                Nhóm {letter}
              </div>
              {group.map((route) => (
                <div
                  key={route.id}
                  onClick={() => navigate(`/passenger/routes/${route.id}`)}
                  className="flex items-center gap-3 px-5 py-3.5 border-b border-[#F0F3F7] hover:bg-[#F8FAFC] cursor-pointer transition-colors"
                >
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#169BA2] to-[#0F7075] text-white flex items-center justify-center flex-shrink-0 font-bold text-base shadow-sm">
                    <Bus size={26} strokeWidth={2.2} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-sm text-[#1A2332]">
                      {route.short_name}
                    </div>
                    <div className="text-sm text-[#4A5A7A] truncate mt-0.5">
                      {route.full_name}
                    </div>
                    <div className="text-xs text-[#8A9AAA] flex items-center gap-1 mt-1">
                      <Clock size={11} />
                      05:00 - 21:00
                    </div>
                  </div>
                  <div onClick={(e) => e.stopPropagation()}>
                    <FavoriteHeartButton routeId={route.id} size="md" />
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

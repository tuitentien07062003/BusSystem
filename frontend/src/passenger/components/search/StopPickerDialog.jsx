import { useState, useEffect, useMemo } from "react";
import { X, Search, MapPin, Loader2 } from "lucide-react";
import { getAllStops } from "../../api/discoveryApi";

export function StopPickerDialog({ isOpen, onClose, onSelect, title }) {
  const [stops, setStops] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [keyword, setKeyword] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    setIsLoading(true);
    getAllStops()
      .then((res) => setStops(res.data || []))
      .catch((err) => console.error(err))
      .finally(() => setIsLoading(false));
  }, [isOpen]);

  const filteredStops = useMemo(() => {
    if (!keyword.trim()) return stops.slice(0, 20);
    const lowerKw = keyword.toLowerCase();
    return stops
      .filter(
        (s) =>
          s.name.toLowerCase().includes(lowerKw) ||
          s.code.toLowerCase().includes(lowerKw),
      )
      .slice(0, 50);
  }, [stops, keyword]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex flex-col bg-white animate-in slide-in-from-bottom duration-200">
      <div className="flex items-center gap-3 p-4 border-b border-[#E5EAF0]">
        <button
          onClick={onClose}
          className="p-2 -ml-2 rounded-full hover:bg-[#F0F3F7]"
        >
          <X size={20} className="text-[#4A5A7A]" />
        </button>
        <h2 className="text-base font-bold text-[#1A2332]">
          {title || "Chọn trạm"}
        </h2>
      </div>

      <div className="p-4 border-b border-[#E5EAF0] bg-[#F8FAFC]">
        <div className="relative">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8A9AAA]"
          />
          <input
            type="text"
            placeholder="Tìm tên trạm hoặc mã trạm..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            className="w-full h-12 pl-10 pr-4 rounded-xl border border-[#D0D7E2] bg-white text-sm outline-none focus:border-[#169BA2]"
            autoFocus
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 size={24} className="animate-spin text-[#169BA2] mb-2" />
            <p className="text-sm text-[#8A9AAA]">Đang tải danh sách trạm...</p>
          </div>
        ) : filteredStops.length === 0 ? (
          <div className="text-center py-10 text-sm text-[#8A9AAA]">
            Không tìm thấy trạm nào.
          </div>
        ) : (
          filteredStops.map((stop) => (
            <button
              key={stop.id}
              onClick={() => {
                onSelect(stop);
                onClose();
              }}
              className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-[#F8FAFC] transition-colors text-left"
            >
              <div className="w-10 h-10 rounded-full bg-[#E6F4F5] flex items-center justify-center flex-shrink-0">
                <MapPin size={18} className="text-[#169BA2]" />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-bold text-[#1A2332] truncate">
                  {stop.name}
                </div>
                <div className="text-xs text-[#8A9AAA] font-mono mt-0.5">
                  {stop.code}
                </div>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}

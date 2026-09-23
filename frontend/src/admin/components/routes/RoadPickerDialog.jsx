import { useState, useEffect } from "react";
import { X, Check, Loader2, Map, RotateCcw, Search } from "lucide-react";
import {
  useNearbyRoads,
  useSetStopOverride,
  useRemoveStopOverride,
} from "@/hooks/useStops";

const HIGHWAY_LABELS = {
  trunk: {
    label: "Quốc lộ",
    color: "bg-blue-50 text-blue-700 border-blue-200",
  },
  trunk_link: {
    label: "Nhánh QL",
    color: "bg-blue-50 text-blue-600 border-blue-200",
  },
  primary: {
    label: "Đường chính",
    color: "bg-teal-50 text-teal-700 border-teal-200",
  },
  primary_link: {
    label: "Nhánh chính",
    color: "bg-teal-50 text-teal-600 border-teal-200",
  },
  secondary: {
    label: "Đường phụ",
    color: "bg-slate-50 text-slate-700 border-slate-200",
  },
  secondary_link: {
    label: "Nhánh phụ",
    color: "bg-slate-50 text-slate-600 border-slate-200",
  },
  tertiary: {
    label: "Đường nhánh",
    color: "bg-slate-50 text-slate-600 border-slate-200",
  },
  tertiary_link: {
    label: "Nhánh nhỏ",
    color: "bg-slate-50 text-slate-500 border-slate-200",
  },
};

function HighwayBadge({ highway }) {
  const meta = HIGHWAY_LABELS[highway] || {
    label: highway,
    color: "bg-slate-50 text-slate-600 border-slate-200",
  };
  return (
    <span
      className={`inline-flex items-center px-1.5 py-0.5 rounded border text-[9px] font-bold uppercase tracking-wide ${meta.color}`}
    >
      {meta.label}
    </span>
  );
}

export function RoadPickerDialog({
  open,
  stop,
  currentOverride,
  onClose,
  onSaved,
}) {
  const [keyword, setKeyword] = useState("");
  const [selectedRoadId, setSelectedRoadId] = useState(null);

  const { data: roads = [], isLoading } = useNearbyRoads(
    stop?.id,
    300,
    open && !!stop?.id,
  );
  const setMut = useSetStopOverride();
  const removeMut = useRemoveStopOverride();

  useEffect(() => {
    if (open) {
      setKeyword("");
      setSelectedRoadId(currentOverride?.road_id ?? null);
    }
  }, [open, currentOverride]);

  const filtered = roads.filter((r) => {
    if (!keyword.trim()) return true;
    const k = keyword.toLowerCase();
    return (r.name || "").toLowerCase().includes(k);
  });

  const handleSave = async () => {
    if (!selectedRoadId || !stop) return;
    await setMut.mutateAsync({ stopId: stop.id, roadId: selectedRoadId });
    onSaved?.();
    onClose();
  };

  const handleRemove = async () => {
    if (!stop) return;
    await removeMut.mutateAsync(stop.id);
    onSaved?.();
    onClose();
  };

  if (!open || !stop) return null;

  return (
    <div className="fixed inset-0 z-[9997] flex items-center justify-center p-4">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm z-[9998]"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col max-h-[85vh] z-[9999]">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center flex-shrink-0">
              <Map size={18} className="text-teal-700" />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-bold text-slate-900 leading-tight">
                Chọn đường cho trạm
              </div>
              <div className="text-xs text-slate-500 truncate">
                {stop.stop_name}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-900 cursor-pointer flex-shrink-0"
          >
            <X size={16} />
          </button>
        </div>

        {/* Current override */}
        {currentOverride && (
          <div className="px-5 py-3 bg-amber-50/50 border-b border-amber-100">
            <div className="flex items-center gap-2 text-[11px]">
              <span className="font-semibold text-amber-800">
                Đang override:
              </span>
              <span className="text-slate-900 font-medium">
                {currentOverride.road_name}
              </span>
              <HighwayBadge highway={currentOverride.highway} />
              <span className="text-slate-500">
                · {currentOverride.distance_m}m
              </span>
            </div>
          </div>
        )}

        {/* Search */}
        <div className="px-5 py-3 border-b border-slate-100">
          <div className="relative">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            />
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Tìm theo tên đường..."
              className="w-full h-9 pl-9 pr-3 rounded-lg border border-slate-200 bg-white text-sm outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20"
            />
          </div>
        </div>

        {/* Road list */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-400">
              <Loader2 size={20} className="animate-spin text-teal-700" />
              <span className="text-xs">Đang tải danh sách đường...</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-sm text-slate-400">
              {keyword
                ? "Không có đường khớp"
                : "Không có đường nào trong 300m"}
            </div>
          ) : (
            <div className="p-2">
              {filtered.map((r) => {
                const isSelected = selectedRoadId === r.id;
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setSelectedRoadId(r.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors mb-1 ${
                      isSelected
                        ? "bg-teal-50 border-l-2 border-l-teal-700"
                        : "hover:bg-slate-50 border-l-2 border-l-transparent"
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                        isSelected
                          ? "border-teal-700 bg-teal-700"
                          : "border-slate-300"
                      }`}
                    >
                      {isSelected && (
                        <Check
                          size={10}
                          className="text-white"
                          strokeWidth={3}
                        />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-sm font-semibold text-slate-900 truncate">
                          {r.name || "(không tên)"}
                        </span>
                        <HighwayBadge highway={r.highway} />
                      </div>
                      <div className="text-[10px] text-slate-500 flex items-center gap-2">
                        <span>Cách {r.distance_m}m</span>
                        {r.oneway && r.oneway !== "no" && (
                          <>
                            <span>·</span>
                            <span className="text-amber-700 font-medium">
                              1 chiều
                            </span>
                          </>
                        )}
                        {r.lanes && (
                          <>
                            <span>·</span>
                            <span>{r.lanes} làn</span>
                          </>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-2 px-5 py-4 border-t border-slate-100 bg-slate-50/50">
          {currentOverride && (
            <button
              type="button"
              onClick={handleRemove}
              disabled={removeMut.isPending}
              className="h-10 px-4 rounded-lg border border-rose-200 bg-white text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
            >
              <RotateCcw size={12} />
              Xoá override
            </button>
          )}

          <div className="flex-1" />

          <button
            type="button"
            onClick={onClose}
            className="h-10 px-4 rounded-lg border border-slate-200 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Hủy
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={!selectedRoadId || setMut.isPending}
            className="h-10 px-5 rounded-lg bg-teal-700 hover:bg-teal-800 text-white text-sm font-semibold flex items-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-sm"
          >
            {setMut.isPending ? (
              <>
                <Loader2 size={14} className="animate-spin" /> Đang lưu...
              </>
            ) : (
              <>
                <Check size={14} /> Lưu đường
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

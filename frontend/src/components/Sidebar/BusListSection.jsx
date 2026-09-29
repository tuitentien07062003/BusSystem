// Danh sách 30 xe bus
import { useSimulation } from "@/hooks/useSimulation";

// Chọn màu chấm tròn theo trạng thái
function dotColor(status, dir) {
  if (status === "running") return dir === "go" ? "#2ecc71" : "#0078d4";
  if (status === "stopped") return "#ffb74d";
  if (status === "done") return "#b0bcca";
  return "#8a9aaa";
}

// Cắt ngắn chuỗi dài
function truncate(s, n) {
  return s && s.length > n ? s.slice(0, n) + "…" : s || "";
}

export function BusListSection() {
  const { busList, trackedBusId, currentDir, toggleTrackBus, clearTrack } =
    useSimulation();

  return (
    <>
      <div className="flex justify-between px-3.5 pt-2.5 pb-1 bg-white border-b border-[#d0d7e2]">
        <span className="text-[10px] text-[#6a7a9a] uppercase tracking-wider">
          Danh sách xe ({busList.length})
        </span>
        <span
          onClick={clearTrack}
          className="text-[10px] text-[#169BA2] cursor-pointer hover:text-[#0F7075]"
        >
          Bỏ theo dõi
        </span>
      </div>

      <div className="flex-1 overflow-y-auto px-2.5 py-1.5 bg-[#f5f7fa] scrollbar-thin">
        {busList.map((bus) => {
          const displayStatus =
            bus.status === "stopped"
              ? `⏸ ${truncate(bus.stopName, 18)}`
              : bus.status === "running"
                ? `→ ${truncate(bus.stopName, 18)}`
                : bus.status === "waiting"
                  ? `Xuất ${bus.startTime.slice(0, 5)}`
                  : "✓ Kết thúc";

          const isTracked = bus.trip_id === trackedBusId;

          return (
            <div
              key={bus.trip_id}
              onClick={() => toggleTrackBus(bus.trip_id)}
              className={`flex items-center gap-2 px-2.5 py-1.5 mb-0.5 rounded-md text-xs cursor-pointer transition-colors border ${
                isTracked
                  ? "bg-[#E6F4F5] border-[#8ab3d0]"
                  : "bg-white border-transparent hover:bg-[#eef2f6]"
              }`}
            >
              <span
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ background: dotColor(bus.status, currentDir) }}
              />
              <span
                className={`font-semibold min-w-[80px] ${
                  bus.status === "running"
                    ? "text-[#169BA2]"
                    : bus.status === "stopped"
                      ? "text-[#d48c2c]"
                      : bus.status === "waiting"
                        ? "text-[#8a9aaa]"
                        : "text-[#b0bcca]"
                }`}
              >
                {bus.trip_id}
              </span>
              {/* Tooltip hiển thị tên trạm đầy đủ khi hover */}
              <span
                className="flex-1 text-[11px] text-[#4a5a7a] overflow-hidden whitespace-nowrap text-ellipsis"
                title={bus.stopName || "—"}
              >
                {displayStatus}
              </span>
              <span className="text-[11px] text-[#169BA2] whitespace-nowrap">
                {bus.timeStr}
              </span>
            </div>
          );
        })}
      </div>
    </>
  );
}

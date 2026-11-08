import { useSimulation } from "@/hooks/useSimulation";

function dotColor(status, dir) {
  if (status === "running") return dir === 0 ? "#169BA2" : "#9333EA";
  if (status === "stopped") return "#E08940";
  if (status === "done") return "#B0BCCA";
  return "#8A9AAA";
}

function shortVehicle(code) {
  if (!code) return "—";
  return code.replace(/^XE_/, "");
}

function shortDriver(code) {
  if (!code) return "—";
  return code.replace(/^DRV_/, "D").replace(/^COD_/, "C");
}

export function BusListSection() {
  const { blockList, trackedBlockId, toggleTrackBlock, clearTrack } =
    useSimulation();

  return (
    <>
      <div className="flex justify-between px-3.5 pt-2.5 pb-1 bg-white border-b border-[#D0D7E2]">
        <span className="text-[10px] text-[#6A7A9A] uppercase tracking-wider font-bold">
          {blockList.length} block
        </span>
        {trackedBlockId && (
          <span
            onClick={clearTrack}
            className="text-[10px] text-[#169BA2] cursor-pointer hover:text-[#0F7075] font-semibold"
          >
            Bỏ theo dõi
          </span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-2 py-1 bg-[#F5F7FA] scrollbar-thin">
        {blockList.length === 0 ? (
          <div className="py-12 text-center text-xs text-[#8A9AAA]">
            Chưa có block nào
          </div>
        ) : (
          blockList.map((block) => {
            const isTracked = block.id === trackedBlockId;
            const color = dotColor(block.status, block.direction_id);

            let label = "";
            if (block.status === "running") {
              label = block.current_trip
                ? `→ ${block.current_trip.slice(-6)}`
                : "Đang chạy";
            } else if (block.status === "stopped") {
              label = "⏸ Dừng trạm";
            } else if (block.status === "waiting") {
              label = "⏳ Chờ xuất bến";
            } else {
              label = "✓ Hoàn thành";
            }

            return (
              <div
                key={block.id}
                onClick={() => toggleTrackBlock(block.id)}
                className={`flex items-center gap-2 px-2.5 py-2 mb-1 rounded-md text-xs cursor-pointer transition-all border ${
                  isTracked
                    ? "bg-[#FEF3E2] border-[#FCD9A0] shadow-sm"
                    : "bg-white border-transparent hover:bg-[#EEF2F6]"
                }`}
              >
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ background: color }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span
                      className="font-mono font-bold text-[11px]"
                      style={{ color }}
                    >
                      XE_{shortVehicle(block.vehicle_code)}
                    </span>
                    <span className="text-[9px] text-[#8A9AAA] font-mono">
                      {block.license_plate}
                    </span>
                  </div>
                  <div className="text-[10px] text-[#4A5A7A] truncate mt-0.5">
                    <span className="font-semibold">
                      {shortDriver(block.driver_code)}
                    </span>
                    {" · "}
                    {label}
                  </div>
                </div>
                <span className="text-[9px] text-[#8A9AAA] font-mono flex-shrink-0">
                  {block.trip_count} trip
                </span>
              </div>
            );
          })
        )}
      </div>
    </>
  );
}

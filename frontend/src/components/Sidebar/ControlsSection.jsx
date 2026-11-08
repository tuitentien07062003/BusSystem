import { Play, Pause, RotateCcw } from "lucide-react";
import { useSimulation } from "@/hooks/useSimulation";
import { SPEED_PRESETS } from "@/engine/simConstants";

export function ControlsSection() {
  const {
    isRunning,
    isPaused,
    start,
    pause,
    resume,
    reset,
    speed,
    setSpeed,
    stats,
  } = useSimulation();

  const hasBlocks = stats.total > 0;
  const allDone = hasBlocks && stats.done === stats.total;

  return (
    <div className="flex flex-col gap-2 px-3.5 py-2.5 bg-white border-b border-[#D0D7E2]">
      <div className="flex gap-1.5">
        {!isRunning || allDone ? (
          <button
            type="button"
            onClick={start}
            disabled={!hasBlocks}
            className="flex-1 h-9 rounded-md bg-[#169BA2] hover:bg-[#12868C] text-white text-xs font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <Play size={13} />
            {allDone ? "Chạy lại" : "Bắt đầu"}
          </button>
        ) : isPaused ? (
          <button
            type="button"
            onClick={resume}
            className="flex-1 h-9 rounded-md bg-[#169BA2] hover:bg-[#12868C] text-white text-xs font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
          >
            <Play size={13} />
            Tiếp tục
          </button>
        ) : (
          <button
            type="button"
            onClick={pause}
            className="flex-1 h-9 rounded-md bg-[#E08940] hover:bg-[#C77A32] text-white text-xs font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
          >
            <Pause size={13} />
            Tạm dừng
          </button>
        )}

        <button
          type="button"
          onClick={reset}
          disabled={!hasBlocks}
          title="Đặt lại"
          className="h-9 px-3 rounded-md border border-[#D0D7E2] bg-white hover:bg-[#F8FAFC] text-[#4A5A7A] flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40 transition-colors text-xs font-semibold"
        >
          <RotateCcw size={13} />
          Reset
        </button>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="text-[10px] font-bold uppercase tracking-wider text-[#8A9AAA]">
            Tốc độ
          </label>
          <span className="text-[11px] font-bold text-[#169BA2]">{speed}×</span>
        </div>

        <div className="grid grid-cols-6 gap-1">
          {SPEED_PRESETS.map((s) => {
            const isActive = speed === s;
            return (
              <button
                key={s}
                type="button"
                onClick={() => setSpeed(s)}
                className={`h-7 rounded text-[10px] font-bold transition-colors cursor-pointer ${
                  isActive
                    ? "bg-[#169BA2] text-white shadow-sm"
                    : "bg-[#F8FAFC] text-[#6A7A9A] hover:bg-[#E6F4F5] hover:text-[#169BA2] border border-[#E5EAF0]"
                }`}
              >
                {s}×
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Nút bắt đầu / reset / thanh trượt tốc độ
import { Play, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useSimulation } from "@/hooks/useSimulation";

export function ControlsSection() {
  const { isSimulating, simData, timeAccel, setTimeAccel, start, reset } =
    useSimulation();

  return (
    <div className="flex flex-col gap-2 px-3.5 py-2.5 bg-white border-b border-[#d0d7e2]">
      <Button
        variant="primary"
        size="full"
        disabled={isSimulating || !simData}
        onClick={start}
      >
        <Play size={14} />
        Bắt đầu tất cả
      </Button>

      <Button variant="secondary" size="full" onClick={reset}>
        <RotateCcw size={14} />
        Reset
      </Button>

      <div className="flex items-center gap-2 mt-1">
        <label className="text-[11px] text-[#6a7a9a] whitespace-nowrap">
          Tốc độ
        </label>
        <Slider
          min={1}
          max={120}
          value={timeAccel}
          onChange={(e) => setTimeAccel(e.target.value)}
        />
        <span className="text-[13px] font-bold text-[#169BA2] min-w-[36px] text-right">
          {timeAccel}×
        </span>
      </div>
    </div>
  );
}

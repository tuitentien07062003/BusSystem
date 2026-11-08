import { Clock } from "lucide-react";
import { useSimulation } from "@/hooks/useSimulation";

export function ClockSection() {
  const { clockText, speed } = useSimulation();

  return (
    <div className="flex gap-2 items-center px-3.5 py-2 bg-white border-b border-[#D0D7E2]">
      <div className="flex-1 flex items-center justify-center gap-2 bg-[#EEF2F6] border border-[#D0D7E2] rounded-md px-3 py-1.5">
        <Clock size={14} className="text-[#169BA2]" />
        <span className="text-sm font-bold text-[#169BA2] tracking-wide font-mono">
          {clockText}
        </span>
      </div>
      <div className="text-xs text-[#6A7A9A] font-semibold min-w-[44px] text-center">
        {speed}×
      </div>
    </div>
  );
}

// Đồng hồ mô phỏng + hệ số tốc độ
import { Clock } from "lucide-react";
import { useSimulation } from "@/hooks/useSimulation";

export function ClockSection() {
  const { clockText, timeAccel } = useSimulation();

  return (
    <div className="flex gap-2 items-center px-3.5 py-2 bg-white border-b border-[#d0d7e2]">
      <div className="flex-1 flex items-center justify-center gap-2 bg-[#eef2f6] border border-[#d0d7e2] rounded-md px-3 py-1.5">
        <Clock size={14} className="text-[#1a5a8a]" />
        <span className="text-sm font-bold text-[#1a5a8a] tracking-wide">
          {clockText}
        </span>
      </div>
      <div className="text-xs text-[#6a7a9a] font-semibold min-w-[40px] text-center">
        {timeAccel}×
      </div>
    </div>
  );
}

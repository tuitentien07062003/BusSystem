import { useSimulation } from "@/hooks/useSimulation";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Bus } from "lucide-react";
import { StatsSection } from "./StatsSection";
import { ClockSection } from "./ClockSection";
import { ControlsSection } from "./ControlsSection";
import { BusListSection } from "./BusListSection";

export function Sidebar({ isLoading }) {
  const { selectedRouteId, setSelectedRouteId, routesList, routeMeta } =
    useSimulation();

  const dirMeta = routeMeta || {};

  return (
    <aside className="w-[320px] flex-shrink-0 h-screen flex flex-col bg-[#F5F7FA] border-r border-[#D0D7E2] z-[1000]">
      {/* Header */}
      <div className="bg-white border-b border-[#D0D7E2] px-5 pt-4 pb-3">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-lg bg-[#169BA2] flex items-center justify-center">
            <Bus size={16} className="text-white" />
          </div>
          <div>
            <div className="text-[15px] font-bold text-[#1A2332] leading-tight">
              Mô phỏng tuyến
            </div>
            <div className="text-[10px] text-[#8A9AAA] uppercase tracking-wider">
              Realtime Animation
            </div>
          </div>
        </div>

        {/* Route selector */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold uppercase tracking-wider text-[#8A9AAA]">
            Chọn tuyến
          </label>
          <Select
            value={selectedRouteId || ""}
            onValueChange={setSelectedRouteId}
            disabled={isLoading}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Chọn tuyến..." />
            </SelectTrigger>
            <SelectContent className="max-h-[300px]">
              {routesList.map((r) => (
                <SelectItem key={r.id} value={String(r.id)}>
                  {r.route_short_name} · {r.route_full_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Route meta badges */}
        {(dirMeta[0] || dirMeta[1]) && (
          <div className="flex items-center gap-1.5 mt-2.5">
            {dirMeta[0] && (
              <span
                className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
                style={{
                  backgroundColor: "#E6F4F5",
                  color: "#0F7075",
                  border: "1px solid #A8D5D8",
                }}
              >
                <span className="w-1 h-1 rounded-full bg-[#169BA2]" />
                Đi · {dirMeta[0].stop_count}
              </span>
            )}
            {dirMeta[1] && (
              <span
                className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
                style={{
                  backgroundColor: "#F3E8FF",
                  color: "#6B21A8",
                  border: "1px solid #D8B4FE",
                }}
              >
                <span className="w-1 h-1 rounded-full bg-[#9333EA]" />
                Về · {dirMeta[1].stop_count}
              </span>
            )}
          </div>
        )}
      </div>

      <StatsSection />
      <ClockSection />
      <ControlsSection />
      <BusListSection />
    </aside>
  );
}

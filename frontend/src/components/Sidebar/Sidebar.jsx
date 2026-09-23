// Sidebar tổng hợp — ghép các section con
import { HeaderSection } from "./HeaderSection";
import { StatsSection } from "./StatsSection";
import { ClockSection } from "./ClockSection";
import { ControlsSection } from "./ControlsSection";
import { BusListSection } from "./BusListSection";

export function Sidebar() {
  return (
    <aside className="w-[300px] flex-shrink-0 h-screen flex flex-col bg-[#f5f7fa] border-r border-[#d0d7e2] z-[1000]">
      <HeaderSection />
      <StatsSection />
      <ClockSection />
      <ControlsSection />
      <BusListSection />
    </aside>
  );
}

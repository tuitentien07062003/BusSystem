import { useSimulation } from "@/hooks/useSimulation";

export function StatsSection() {
  const { stats } = useSimulation();

  const boxes = [
    {
      key: "running",
      label: "Chạy",
      value: stats.running,
      color: "text-[#169BA2]",
    },
    {
      key: "stopped",
      label: "Dừng",
      value: stats.stopped,
      color: "text-[#E08940]",
    },
    {
      key: "waiting",
      label: "Chờ",
      value: stats.waiting,
      color: "text-[#8A9AAA]",
    },
    { key: "done", label: "Xong", value: stats.done, color: "text-[#B0BCCA]" },
  ];

  return (
    <div className="grid grid-cols-4 gap-1.5 px-3.5 py-2.5 bg-white border-b border-[#D0D7E2]">
      {boxes.map((b) => (
        <div key={b.key} className="bg-[#EEF2F6] rounded-md py-2 text-center">
          <div className={`text-lg font-bold ${b.color}`}>{b.value}</div>
          <div className="text-[9px] text-[#6A7A9A] uppercase tracking-wide mt-0.5">
            {b.label}
          </div>
        </div>
      ))}
    </div>
  );
}

import { useSimulation } from "@/hooks/useSimulation";

export function StatsSection() {
  const { stats } = useSimulation();

  const boxes = [
    {
      key: "running",
      label: "Đang chạy",
      value: stats.running,
      color: "text-[#169BA2]",
    },
    {
      key: "stopped",
      label: "Dừng trạm",
      value: stats.stopped,
      color: "text-[#d48c2c]",
    },
    {
      key: "waiting",
      label: "Chờ/Xong",
      value: stats.waiting,
      color: "text-[#8a9aaa]",
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-1.5 px-3.5 py-2.5 bg-white border-b border-[#d0d7e2]">
      {boxes.map((b) => (
        <div key={b.key} className="bg-[#eef2f6] rounded-md py-2 text-center">
          <div className={`text-lg font-bold ${b.color}`}>{b.value}</div>
          <div className="text-[9px] text-[#6a7a9a] uppercase tracking-wide mt-0.5">
            {b.label}
          </div>
        </div>
      ))}
    </div>
  );
}

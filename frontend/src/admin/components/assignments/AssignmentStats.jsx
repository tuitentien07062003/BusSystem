import { Activity, AlertTriangle } from "lucide-react";
import { useAssignmentStats } from "@/hooks/useAssignments";

function HeroBlock({ value, loading }) {
  return (
    <div className="relative flex-shrink-0 px-5 py-3 rounded-xl bg-[#169BA2] text-white shadow-sm min-w-[120px]">
      <div className="text-[10px] font-bold uppercase tracking-wider opacity-70">
        Tổng blocks
      </div>
      <div className="text-3xl font-bold leading-none mt-1.5">
        {loading ? "—" : value}
      </div>
    </div>
  );
}

function ShiftSplitBar({ morning, evening, loading }) {
  const total = morning + evening;
  const morningPct = total > 0 ? (morning / total) * 100 : 50;
  const eveningPct = total > 0 ? (evening / total) * 100 : 50;

  return (
    <div className="flex-1 min-w-[200px] space-y-2">
      <div className="flex items-center justify-between text-[11px]">
        <div className="inline-flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#169BA2]" />
          <span className="font-semibold text-[#0F7075]">
            {loading ? "—" : morning}
          </span>
          <span className="text-[#8A9AAA]">ca sáng</span>
        </div>
        <div className="inline-flex items-center gap-1.5">
          <span className="text-[#8A9AAA]">ca tối</span>
          <span className="font-semibold text-[#6B21A8]">
            {loading ? "—" : evening}
          </span>
          <span className="w-2 h-2 rounded-full bg-[#9333EA]" />
        </div>
      </div>
      <div className="flex h-2.5 rounded-full overflow-hidden bg-[#F8FAFC] border border-[#E5EAF0]">
        <div
          className="bg-[#169BA2] transition-all duration-500"
          style={{ width: `${morningPct}%` }}
        />
        <div
          className="bg-[#9333EA] transition-all duration-500"
          style={{ width: `${eveningPct}%` }}
        />
      </div>
    </div>
  );
}

function StatusChip({ color, label, value, pulse, loading, muted }) {
  const colorMap = {
    green: "bg-[#2E7D32]",
    amber: "bg-[#E08940]",
    teal: "bg-[#169BA2]",
    red: "bg-[#C62828]",
    gray: "bg-[#B0BCCA]",
  };

  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-colors ${
        muted ? "bg-[#F8FAFC] border-[#F0F3F7]" : "bg-white border-[#E5EAF0]"
      }`}
    >
      <span className="relative flex-shrink-0">
        {pulse && !loading && (
          <span
            className={`absolute inline-flex h-full w-full rounded-full ${colorMap[color]} opacity-60 animate-ping`}
          />
        )}
        <span
          className={`relative inline-flex w-2 h-2 rounded-full ${colorMap[color]}`}
        />
      </span>
      <span
        className={`text-sm font-bold ${
          muted ? "text-[#8A9AAA]" : "text-[#1A2332]"
        }`}
      >
        {loading ? "—" : value}
      </span>
      <span className="text-[11px] text-[#8A9AAA] font-medium">{label}</span>
    </div>
  );
}

export function AssignmentStats({ date, depotId }) {
  const { data, isLoading } = useAssignmentStats({
    date,
    depot_id: depotId === "all" ? undefined : depotId,
  });

  const byStatus = data?.by_status || {};
  const byShift = data?.by_shift || {};

  const total = data?.total || 0;
  const inProgress = byStatus.in_progress || 0;
  const completed = byStatus.completed || 0;
  const cancelled = byStatus.cancelled || 0;
  const scheduled = byStatus.scheduled || 0;

  const morning = byShift["1"] || 0;
  const evening = byShift["2"] || 0;

  return (
    <div className="bg-white rounded-xl border border-[#E5EAF0] p-4 flex flex-col lg:flex-row lg:items-center gap-4">
      <HeroBlock value={total} loading={isLoading} />

      <div className="hidden lg:block w-px h-12 bg-[#F0F3F7]" />

      <ShiftSplitBar morning={morning} evening={evening} loading={isLoading} />

      <div className="hidden lg:block w-px h-12 bg-[#F0F3F7]" />

      <div className="flex flex-wrap items-center gap-2">
        <StatusChip
          color="amber"
          label="đang chạy"
          value={inProgress}
          pulse={inProgress > 0}
          loading={isLoading}
          muted={inProgress === 0}
        />
        <StatusChip
          color="teal"
          label="hoàn thành"
          value={completed}
          loading={isLoading}
          muted={completed === 0}
        />
        <StatusChip
          color="green"
          label="chờ chạy"
          value={scheduled}
          loading={isLoading}
          muted={scheduled === 0}
        />
        {cancelled > 0 && (
          <StatusChip
            color="red"
            label="đã hủy"
            value={cancelled}
            loading={isLoading}
          />
        )}
      </div>
    </div>
  );
}

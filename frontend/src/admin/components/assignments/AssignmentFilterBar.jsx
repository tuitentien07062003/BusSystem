import { Calendar, RefreshCw } from "lucide-react";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

const DEPOT_PALETTE = [
  {
    bg: "bg-[#169BA2]",
    light: "bg-[#E6F4F5]",
    text: "text-[#0F7075]",
    hex: "#169BA2",
  },
  {
    bg: "bg-[#E08940]",
    light: "bg-[#FEF3E2]",
    text: "text-[#B45309]",
    hex: "#E08940",
  },
  {
    bg: "bg-[#9333EA]",
    light: "bg-[#F3E8FF]",
    text: "text-[#6B21A8]",
    hex: "#9333EA",
  },
  {
    bg: "bg-[#0284C7]",
    light: "bg-[#E0F2FE]",
    text: "text-[#075985]",
    hex: "#0284C7",
  },
  {
    bg: "bg-[#DB2777]",
    light: "bg-[#FCE7F3]",
    text: "text-[#9F1239]",
    hex: "#DB2777",
  },
];

function getDepotInitials(name) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

function DepotTab({ active, label, count, colorIdx, onClick }) {
  const palette = DEPOT_PALETTE[colorIdx % DEPOT_PALETTE.length];
  const initials = getDepotInitials(label);

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative inline-flex items-center gap-2 pl-1.5 pr-3 py-1.5 rounded-full border transition-all cursor-pointer ${
        active
          ? "bg-[#E6F4F5] border-[#169BA2] text-[#0F7075] shadow-sm"
          : "bg-white border-[#E5EAF0] text-[#4A5A7A] hover:border-[#A8D5D8]"
      }`}
    >
      <span
        className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0 shadow-sm ${palette.bg}`}
      >
        {initials}
      </span>

      <span className="text-xs font-semibold">{label}</span>

      {count !== undefined && count > 0 && (
        <span
          className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center ${
            active
              ? "bg-[#169BA2] text-white"
              : `${palette.light} ${palette.text}`
          }`}
        >
          {count}
        </span>
      )}
    </button>
  );
}

function AllTab({ active, total, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2 pl-1.5 pr-3 py-1.5 rounded-full border transition-all cursor-pointer ${
        active
          ? "bg-[#E6F4F5] border-[#169BA2] text-[#0F7075] shadow-sm"
          : "bg-white border-[#E5EAF0] text-[#4A5A7A] hover:border-[#A8D5D8]"
      }`}
    >
      <span
        className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
          active ? "bg-white" : "bg-[#F8FAFC]"
        }`}
      >
        <span className="grid grid-cols-2 gap-0.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#169BA2]" />
          <span className="w-1.5 h-1.5 rounded-full bg-[#E08940]" />
          <span className="w-1.5 h-1.5 rounded-full bg-[#9333EA]" />
          <span className="w-1.5 h-1.5 rounded-full bg-[#0284C7]" />
        </span>
      </span>
      <span className="text-xs font-semibold">Tất cả</span>
      {total !== undefined && total > 0 && (
        <span
          className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center ${
            active ? "bg-[#169BA2] text-white" : "bg-[#F8FAFC] text-[#6A7A9A]"
          }`}
        >
          {total}
        </span>
      )}
    </button>
  );
}

export function AssignmentFilterBar({
  date,
  depotId,
  routeId,
  onDateChange,
  onDepotChange,
  onRouteChange,
  onRefresh,
  isFetching,
  depots = [],
  routes = [],
  totalBlocks,
}) {
  return (
    <div className="bg-white rounded-xl border border-[#E5EAF0] p-3 space-y-3">
      <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-thin pb-1">
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <AllTab
            active={depotId === "all"}
            total={totalBlocks}
            onClick={() => onDepotChange("all")}
          />
          {depots.map((d, idx) => (
            <DepotTab
              key={d.id}
              active={depotId === String(d.id)}
              label={d.stop_name || `Depot #${d.id}`}
              colorIdx={idx}
              onClick={() => onDepotChange(String(d.id))}
            />
          ))}
        </div>
      </div>

      <div className="h-px bg-gradient-to-r from-[#F0F3F7] via-[#E5EAF0] to-[#F0F3F7]" />

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#169BA2] to-[#0F7075] flex items-center justify-center flex-shrink-0 shadow-sm">
            <Calendar size={14} className="text-white" />
          </div>
          <input
            type="date"
            value={date}
            onChange={(e) => onDateChange(e.target.value)}
            className="h-9 px-3 rounded-md border border-[#D0D7E2] bg-white text-sm font-mono text-[#1A2332] outline-none focus:border-[#169BA2] focus:ring-2 focus:ring-[#169BA2]/20 cursor-pointer"
          />
        </div>

        <Select value={routeId} onValueChange={onRouteChange}>
          <SelectTrigger className="w-[220px] h-9">
            <SelectValue placeholder="Tất cả tuyến" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả tuyến</SelectItem>
            {routes.map((r) => (
              <SelectItem key={r.id} value={String(r.id)}>
                {r.route_short_name} · {r.route_full_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex-1" />

        <button
          type="button"
          onClick={onRefresh}
          disabled={isFetching}
          title="Tải lại"
          className="h-9 w-9 flex-shrink-0 rounded-md border border-[#D0D7E2] bg-white hover:bg-[#F8FAFC] disabled:opacity-50 flex items-center justify-center cursor-pointer"
        >
          <RefreshCw
            size={14}
            className={
              isFetching ? "animate-spin text-[#169BA2]" : "text-[#4A5A7A]"
            }
          />
        </button>
      </div>
    </div>
  );
}

import { RefreshCw, CalendarDays } from "lucide-react";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { fmtMonthLabel } from "./rosterConstants";

function buildMonthOptions(count = 6) {
  const options = [];
  const now = new Date();
  for (let i = -2; i < count; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    const p = (n) => String(n).padStart(2, "0");
    const value = `${d.getFullYear()}-${p(d.getMonth() + 1)}`;
    options.push({ value, label: fmtMonthLabel(value) });
  }
  return options;
}

export function RosterFilterBar({
  month,
  depotId,
  onMonthChange,
  onDepotChange,
  onRefresh,
  isFetching,
  depots = [],
}) {
  const monthOptions = buildMonthOptions(8);

  return (
    <div className="bg-white rounded-xl border border-[#E5EAF0] p-3 flex flex-col sm:flex-row gap-2 sm:items-center">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-[#E6F4F5] flex items-center justify-center flex-shrink-0">
          <CalendarDays size={14} className="text-[#169BA2]" />
        </div>
        <Select value={month} onValueChange={onMonthChange}>
          <SelectTrigger className="w-[170px] h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {monthOptions.map((m) => (
              <SelectItem key={m.value} value={m.value}>
                {m.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="w-px h-6 bg-[#E5EAF0] hidden sm:block" />

      <Select value={depotId} onValueChange={onDepotChange}>
        <SelectTrigger className="w-full sm:w-[200px] h-9">
          <SelectValue placeholder="Tất cả depot" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tất cả depot</SelectItem>
          {depots.map((d) => (
            <SelectItem key={d.id} value={String(d.id)}>
              {d.stop_name || d.name || `Depot #${d.id}`}
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
  );
}

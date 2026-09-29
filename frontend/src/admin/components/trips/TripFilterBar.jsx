// src/admin/components/trips/TripFilterBar.jsx
// Bộ lọc trung tâm cho Dashboard quản lý chuyến xe
import { useEffect, useRef } from "react";
import { Search, X, RefreshCw } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════
export function TripFilterBar({
  // State values
  date,
  routeId,
  directionId,
  status,
  searchInput,
  // Setters
  onDateChange,
  onRouteChange,
  onDirectionChange,
  onStatusChange,
  onSearchChange,
  // Options
  routes = [],
  // Actions
  onRefresh,
  isFetching,
}) {
  const inputRef = useRef(null);

  // Phím tắt "/" để focus ô tìm kiếm
  useEffect(() => {
    const onKey = (e) => {
      if (
        e.key === "/" &&
        !["INPUT", "TEXTAREA"].includes(document.activeElement?.tagName)
      ) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="bg-white rounded-lg border border-[#E5EAF0] p-3">
      <div className="flex flex-wrap items-center gap-2">
        {/* ─── Ngày ─── */}
        <div className="flex items-center gap-2">
          <label className="text-[11px] font-semibold text-[#6A7A9A] whitespace-nowrap">
            Ngày
          </label>
          <Input
            type="date"
            value={date}
            onChange={(e) => onDateChange(e.target.value)}
            className="w-[150px] font-mono text-sm h-9"
          />
        </div>

        {/* ─── Tuyến ─── */}
        <Select value={routeId} onValueChange={onRouteChange}>
          <SelectTrigger className="w-[180px] h-9">
            <SelectValue placeholder="Tất cả tuyến" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả tuyến</SelectItem>
            {routes.map((r) => (
              <SelectItem key={r.id} value={String(r.id)}>
                {r.route_short_name} ({r.route_id})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* ─── Hướng ─── */}
        <Select value={directionId} onValueChange={onDirectionChange}>
          <SelectTrigger className="w-[150px] h-9">
            <SelectValue placeholder="Tất cả hướng" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả hướng</SelectItem>
            <SelectItem value="0">Chiều đi</SelectItem>
            <SelectItem value="1">Chiều về</SelectItem>
          </SelectContent>
        </Select>

        {/* ─── Trạng thái ─── */}
        <Select value={status} onValueChange={onStatusChange}>
          <SelectTrigger className="w-[150px] h-9">
            <SelectValue placeholder="Trạng thái" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả trạng thái</SelectItem>
            <SelectItem value="scheduled">Chưa chạy</SelectItem>
            <SelectItem value="in_progress">Đang chạy</SelectItem>
            <SelectItem value="completed">Hoàn thành</SelectItem>
            <SelectItem value="cancelled">Đã hủy</SelectItem>
          </SelectContent>
        </Select>

        {/* ─── Search ─── */}
        <div className="relative flex-1 min-w-[200px]">
          <Search
            size={13}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8A9AAA] pointer-events-none"
          />
          <Input
            ref={inputRef}
            value={searchInput}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Tìm theo mã chuyến…  (nhấn / để focus)"
            className="h-9 pl-8 pr-8"
          />
          {searchInput && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-5 h-5 rounded flex items-center justify-center text-[#8A9AAA] hover:bg-[#F0F3F7] hover:text-[#1A2332] cursor-pointer"
            >
              <X size={12} />
            </button>
          )}
        </div>

        {/* ─── Refresh ─── */}
        <button
          type="button"
          onClick={onRefresh}
          disabled={isFetching}
          title="Tải lại"
          className="h-9 w-9 flex-shrink-0 rounded-md border border-[#D0D7E2] bg-white hover:bg-[#F8FAFC] disabled:opacity-50 flex items-center justify-center cursor-pointer"
        >
          <RefreshCw
            size={13}
            className={
              isFetching ? "animate-spin text-[#169BA2]" : "text-[#6A7A9A]"
            }
          />
        </button>
      </div>
    </div>
  );
}

import { useEffect, useRef } from "react";
import { Search, RefreshCw, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

export function VehicleFilterBar({
  searchInput,
  typeFilter,
  statusFilter,
  depotFilter,
  onSearchChange,
  onTypeChange,
  onStatusChange,
  onDepotChange,
  onRefresh,
  isFetching,
  depots = [],
}) {
  const inputRef = useRef(null);

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
    <div className="bg-white rounded-xl border border-[#E5EAF0] p-3 flex flex-col lg:flex-row gap-2 lg:items-center">
      <div className="relative flex-1">
        <Search
          size={14}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8A9AAA] pointer-events-none"
        />
        <Input
          ref={inputRef}
          placeholder="Tìm theo mã xe hoặc biển số...  (nhấn / để focus)"
          value={searchInput}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-8 pr-8 h-9"
        />
        {searchInput && (
          <button
            type="button"
            onClick={() => onSearchChange("")}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-5 h-5 rounded flex items-center justify-center text-[#8A9AAA] hover:bg-[#EEF2F6] cursor-pointer"
          >
            <X size={12} />
          </button>
        )}
      </div>

      <Select value={typeFilter} onValueChange={onTypeChange}>
        <SelectTrigger className="w-full lg:w-[180px] h-9">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tất cả loại xe</SelectItem>
          <SelectItem value="1">Xe buýt 45 chỗ</SelectItem>
          <SelectItem value="2">Xe buýt 65 chỗ</SelectItem>
          <SelectItem value="3">Xe buýt điện 60 chỗ</SelectItem>
        </SelectContent>
      </Select>

      <Select value={depotFilter} onValueChange={onDepotChange}>
        <SelectTrigger className="w-full lg:w-[170px] h-9">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tất cả depot</SelectItem>
          {depots.map((d) => (
            <SelectItem key={d.id} value={String(d.id)}>
              {d.name || `Depot #${d.id}`}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={statusFilter} onValueChange={onStatusChange}>
        <SelectTrigger className="w-full lg:w-[150px] h-9">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tất cả trạng thái</SelectItem>
          <SelectItem value="true">Đang hoạt động</SelectItem>
          <SelectItem value="false">Ngưng hoạt động</SelectItem>
        </SelectContent>
      </Select>

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

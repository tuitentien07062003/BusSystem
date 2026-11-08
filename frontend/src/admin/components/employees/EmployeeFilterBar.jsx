import { useEffect, useRef } from "react";
import { Search, RefreshCw, X, LayoutGrid, List } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { EmployeeTypeChips } from "./EmployeeTypeChips";

export function EmployeeFilterBar({
  searchInput,
  typeFilter,
  statusFilter,
  viewMode,
  onSearchChange,
  onTypeChange,
  onStatusChange,
  onViewModeChange,
  onRefresh,
  isFetching,
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
    <div className="bg-white rounded-xl border border-[#E5EAF0] p-3 space-y-3">
      {/* Row 1: Search + status + view */}
      <div className="flex gap-2 items-center">
        <div className="relative flex-1">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8A9AAA] pointer-events-none"
          />
          <Input
            ref={inputRef}
            placeholder="Tìm theo mã, tên, SĐT, email...  (nhấn / để focus)"
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

        <Select value={statusFilter} onValueChange={onStatusChange}>
          <SelectTrigger className="w-[150px] h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả trạng thái</SelectItem>
            <SelectItem value="true">Đang hoạt động</SelectItem>
            <SelectItem value="false">Ngưng hoạt động</SelectItem>
          </SelectContent>
        </Select>

        {/* View toggle */}
        <div className="inline-flex items-center bg-[#F8FAFC] rounded-md border border-[#E5EAF0] p-0.5">
          <button
            type="button"
            onClick={() => onViewModeChange("grid")}
            title="Dạng thẻ"
            className={`w-8 h-8 rounded flex items-center justify-center cursor-pointer transition-colors ${
              viewMode === "grid"
                ? "bg-white text-[#169BA2] shadow-sm"
                : "text-[#8A9AAA] hover:text-[#4A5A7A]"
            }`}
          >
            <LayoutGrid size={14} />
          </button>
          <button
            type="button"
            onClick={() => onViewModeChange("list")}
            title="Dạng bảng"
            className={`w-8 h-8 rounded flex items-center justify-center cursor-pointer transition-colors ${
              viewMode === "list"
                ? "bg-white text-[#169BA2] shadow-sm"
                : "text-[#8A9AAA] hover:text-[#4A5A7A]"
            }`}
          >
            <List size={14} />
          </button>
        </div>

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

      {/* Row 2: Type chips */}
      <EmployeeTypeChips value={typeFilter} onChange={onTypeChange} />
    </div>
  );
}

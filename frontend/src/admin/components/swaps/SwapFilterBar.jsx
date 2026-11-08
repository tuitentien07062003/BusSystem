import { useState, useEffect, useRef } from "react";
import { Search, RefreshCw, X, Calendar } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { SwapStatsInline } from "./SwapStatsInline";

export function SwapFilterBar({
  fromDate,
  toDate,
  statusFilter,
  searchInput,
  onFromDateChange,
  onToDateChange,
  onStatusChange,
  onSearchChange,
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

  const setQuickRange = (days) => {
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - days);
    const p = (n) => String(n).padStart(2, "0");
    const fmt = (d) =>
      `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
    onFromDateChange(fmt(from));
    onToDateChange(fmt(to));
  };

  return (
    <div className="bg-white rounded-xl border border-[#E5EAF0] p-3 space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#F3E8FF] flex items-center justify-center flex-shrink-0">
            <Calendar size={14} className="text-[#9333EA]" />
          </div>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => onFromDateChange(e.target.value)}
            className="h-9 px-3 rounded-md border border-[#D0D7E2] bg-white text-sm font-mono text-[#1A2332] outline-none focus:border-[#9333EA] focus:ring-2 focus:ring-[#9333EA]/20 cursor-pointer"
          />
          <span className="text-[#8A9AAA] text-sm">→</span>
          <input
            type="date"
            value={toDate}
            onChange={(e) => onToDateChange(e.target.value)}
            className="h-9 px-3 rounded-md border border-[#D0D7E2] bg-white text-sm font-mono text-[#1A2332] outline-none focus:border-[#9333EA] focus:ring-2 focus:ring-[#9333EA]/20 cursor-pointer"
          />
        </div>

        <div className="inline-flex items-center bg-[#F8FAFC] rounded-lg border border-[#E5EAF0] p-0.5">
          {[
            { label: "7 ngày", days: 7 },
            { label: "30 ngày", days: 30 },
            { label: "90 ngày", days: 90 },
          ].map((r) => (
            <button
              key={r.days}
              type="button"
              onClick={() => setQuickRange(r.days)}
              className="px-2.5 py-1 rounded-md text-[11px] font-semibold text-[#6A7A9A] hover:bg-white hover:text-[#9333EA] hover:shadow-sm transition-all cursor-pointer"
            >
              {r.label}
            </button>
          ))}
        </div>

        <div className="flex-1" />

        <Select value={statusFilter} onValueChange={onStatusChange}>
          <SelectTrigger className="w-[170px] h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả trạng thái</SelectItem>
            <SelectItem value="pending">Chờ duyệt</SelectItem>
            <SelectItem value="approved">Đã duyệt</SelectItem>
            <SelectItem value="completed">Hoàn thành</SelectItem>
            <SelectItem value="rejected">Từ chối</SelectItem>
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
              isFetching ? "animate-spin text-[#9333EA]" : "text-[#4A5A7A]"
            }
          />
        </button>
      </div>

      <div className="h-px bg-[#F0F3F7]" />

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[280px]">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8A9AAA] pointer-events-none"
          />
          <Input
            ref={inputRef}
            placeholder="Tìm theo mã/tên tài xế...  (nhấn / để focus)"
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

        <div className="flex-shrink-0">
          <SwapStatsInline from={fromDate} to={toDate} />
        </div>
      </div>
    </div>
  );
}

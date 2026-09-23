import { useEffect, useRef } from 'react';
import { Search, RefreshCw, Download, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';

export function StopsFilters({
  searchInput,
  onSearchChange,
  statusFilter,
  onStatusChange,
  onRefresh,
  onExport,
  isFetching,
  canExport,
  placeholder = 'Tìm theo tên...  (nhấn / để focus)',
  enableShortcut = true,
  hideStatusFilter = false,
}) {
  const inputRef = useRef(null);

  // Phím tắt "/" để focus ô tìm kiếm
  useEffect(() => {
    if (!enableShortcut) return;
    const onKey = (e) => {
      if (
        e.key === '/' &&
        !['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)
      ) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [enableShortcut]);

  return (
    <div className="bg-white rounded-lg border border-[#d0d7e2] p-3 flex flex-col sm:flex-row gap-2 sm:items-center">
      <div className="relative flex-1">
        <Search
          size={14}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8a9aaa] pointer-events-none"
        />
        <Input
          ref={inputRef}
          placeholder={placeholder}
          value={searchInput}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-8 pr-8"
        />
        {searchInput && (
          <button
            onClick={() => onSearchChange('')}
            title="Xoá"
            className="absolute right-2 top-1/2 -translate-y-1/2 w-5 h-5 rounded flex items-center justify-center text-[#8a9aaa] hover:bg-[#eef2f6] hover:text-[#1a2332] cursor-pointer"
          >
            <X size={12} />
          </button>
        )}
      </div>

      {!hideStatusFilter && (
        <Select value={statusFilter} onValueChange={onStatusChange}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả trạng thái</SelectItem>
            <SelectItem value="true">Đang hoạt động</SelectItem>
            <SelectItem value="false">Ngưng hoạt động</SelectItem>
          </SelectContent>
        </Select>
      )}

      <button
        onClick={onExport}
        disabled={!canExport}
        title="Xuất CSV (trang hiện tại)"
        className="h-9 px-3 flex-shrink-0 rounded-md border border-[#cbd5e1] bg-white hover:bg-[#eef2f6] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 text-xs font-semibold text-[#4a5a7a] cursor-pointer"
      >
        <Download size={13} />
        CSV
      </button>

      <button
        onClick={onRefresh}
        disabled={isFetching}
        title="Tải lại"
        className="h-9 w-9 flex-shrink-0 rounded-md border border-[#cbd5e1] bg-white hover:bg-[#eef2f6] disabled:opacity-50 flex items-center justify-center cursor-pointer"
      >
        <RefreshCw
          size={14}
          className={isFetching ? 'animate-spin text-[#1a5a8a]' : 'text-[#4a5a7a]'}
        />
      </button>
    </div>
  );
}

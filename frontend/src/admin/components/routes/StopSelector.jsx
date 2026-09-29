import { Search, X, Check, MapPin, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';

export function StopSelector({
  results = [],
  selectedStops = [],
  selectedIds,
  onToggle,
  onClearAll,
  onFocus,
  focusedId,
  hoveredId,
  onHover,
  keyword,
  onKeywordChange,
  isLoading,
  disabled,
}) {
  if (disabled) {
    return (
      <div className="rounded-md border border-dashed border-[#d0d7e2] p-6 text-center text-xs text-[#8a9aaa]">
        Chọn đủ điểm đầu và điểm cuối để hiển thị danh sách trạm
      </div>
    );
  }

  const hasKeyword = keyword.trim().length > 0;
  const resultIds = new Set(results.map((s) => s.id));
  const selectedOnly = hasKeyword
    ? []
    : selectedStops.filter((s) => !resultIds.has(s.id));

  const selectedMatching = hasKeyword
    ? results.filter((s) => selectedIds.has(s.id)).length
    : 0;

  // Click vào cả row → toggle chọn + focus map
  const handleRowClick = (stop) => {
    onToggle(stop);              // tick/bỏ tick
    onFocus?.(stop);             // flyTo stop
  };

  return (
    <div className="flex flex-col border border-[#cbd5e1] rounded-md overflow-hidden bg-white">
      <div className="flex items-center justify-between px-3 py-2 border-b border-[#eef2f6] bg-[#f8fafc]">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-[#4a5a7a]">Trạm dừng</span>
          {selectedIds.size > 0 && (
            <Badge variant="info">Đã chọn {selectedIds.size}</Badge>
          )}
          {hasKeyword && selectedMatching > 0 && (
            <Badge variant="success">{selectedMatching} khớp keyword</Badge>
          )}
        </div>
        {selectedIds.size > 0 && (
          <button
            onClick={onClearAll}
            className="text-[11px] font-semibold text-[#c0392b] hover:text-[#a93226] cursor-pointer flex items-center gap-1"
          >
            <X size={11} /> Bỏ chọn tất cả
          </button>
        )}
      </div>

      <div className="p-2 border-b border-[#eef2f6]">
        <div className="relative">
          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#8a9aaa]" />
          <Input
            value={keyword}
            onChange={(e) => onKeywordChange(e.target.value)}
            placeholder="Tìm trạm (không cần dấu)..."
            className="h-8 pl-7 pr-7 text-xs"
            autoFocus
          />
          {isLoading && (
            <Loader2
              size={12}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#169BA2] animate-spin"
            />
          )}
        </div>
        <div className="mt-1 text-[10px] text-[#8a9aaa]">
          {hasKeyword
            ? isLoading ? 'Đang tìm...' : `${results.length} kết quả khớp`
            : `Hiển thị ${results.length} trạm đầu · Gõ để tìm`}
        </div>
      </div>

      <div className="max-h-[320px] overflow-y-auto scrollbar-thin">
        {!hasKeyword && selectedOnly.length > 0 && (
          <>
            <div className="px-3 py-1.5 bg-[#f0f7fc] text-[10px] font-bold uppercase tracking-wider text-[#169BA2] border-b border-[#e5eaf0] sticky top-0 z-10">
              Đã chọn ({selectedOnly.length})
            </div>
            {selectedOnly.map((s) => (
              <StopRow
                key={`sel-${s.id}`}
                stop={s}
                checked={true}
                hovered={hoveredId === s.id}
                focused={focusedId === s.id}
                onClick={() => handleRowClick(s)}
                onHover={onHover}
              />
            ))}
            <div className="px-3 py-1.5 bg-[#f8fafc] text-[10px] font-bold uppercase tracking-wider text-[#8a9aaa] border-y border-[#eef2f6] sticky top-0 z-10">
              Tất cả trạm
            </div>
          </>
        )}

        {results.length === 0 && !isLoading ? (
          <div className="px-3 py-8 text-center text-xs text-[#8a9aaa]">
            {hasKeyword ? 'Không tìm thấy trạm nào khớp' : 'Đang tải danh sách trạm...'}
          </div>
        ) : (
          results.map((s) => (
            <StopRow
              key={s.id}
              stop={s}
              checked={selectedIds.has(s.id)}
              hovered={hoveredId === s.id}
              focused={focusedId === s.id}
              onClick={() => handleRowClick(s)}
              onHover={onHover}
            />
          ))
        )}
      </div>
    </div>
  );
}

function StopRow({ stop, checked, hovered, focused, onClick, onHover }) {
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => onHover?.(stop)}
      onMouseLeave={() => onHover?.(null)}
      className={`flex items-center gap-2 px-3 py-2 cursor-pointer border-b border-[#f3f5f9] last:border-0 transition-colors ${
        checked ? 'bg-[#f0f7fc]' : ''
      } ${hovered ? 'bg-[#fdf2e3]' : 'hover:bg-[#f8fafc]'}`}
    >
      <Checkbox checked={checked} onCheckedChange={() => {}} />
      <div className="flex-1 min-w-0">
        <div className="text-xs font-medium text-[#1a2332] truncate">{stop.stop_name}</div>
        <div className="text-[10px] text-[#8a9aaa] font-mono">{stop.stop_id}</div>
      </div>
      {hovered && !checked && <MapPin size={12} className="text-[#d48c2c] flex-shrink-0" />}
      {checked && !hovered && <Check size={13} className="text-[#169BA2] flex-shrink-0" />}
    </div>
  );
}

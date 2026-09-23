import { useState, useMemo } from 'react';
import { Search, MapPin, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { matchesSearch } from '@/lib/vietnamese';

function DepotPicker({ depots, value, onChange, placeholder, disabled }) {
  const [open, setOpen] = useState(false);
  const [kw, setKw] = useState('');

  const filtered = useMemo(() => {
    if (!kw.trim()) return depots;
    return depots.filter(
      (d) =>
        matchesSearch(d.stop_name, kw) ||
        matchesSearch(d.stop_id, kw)
    );
  }, [depots, kw]);

  const selected = depots.find((d) => d.id === value);

  return (
    <div className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        className={`w-full h-9 px-3 rounded-md border bg-white text-sm text-left flex items-center justify-between gap-2 cursor-pointer transition-colors ${
          disabled
            ? 'border-[#e5eaf0] text-[#b0bcca] cursor-not-allowed'
            : 'border-[#cbd5e1] hover:border-[#5fc3e4]'
        }`}
      >
        {selected ? (
          <span className="flex items-center gap-1.5 min-w-0">
            <MapPin size={13} className="text-[#2e7d5a] flex-shrink-0" />
            <span className="truncate font-medium text-[#1a2332]">{selected.stop_name}</span>
            <span className="text-[10px] text-[#8a9aaa] font-mono flex-shrink-0">{selected.stop_id}</span>
          </span>
        ) : (
          <span className="text-[#8a9aaa]">{placeholder}</span>
        )}
        {selected && !disabled && (
          <X
            size={14}
            className="text-[#8a9aaa] hover:text-[#c0392b] flex-shrink-0"
            onClick={(e) => {
              e.stopPropagation();
              onChange(null);
            }}
          />
        )}
      </button>

      {open && !disabled && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-white rounded-md border border-[#d0d7e2] shadow-lg overflow-hidden">
            <div className="p-2 border-b border-[#eef2f6]">
              <div className="relative">
                <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#8a9aaa]" />
                <Input
                  value={kw}
                  onChange={(e) => setKw(e.target.value)}
                  placeholder="Tìm depot (không cần dấu)..."
                  className="h-8 pl-7 text-xs"
                  autoFocus
                />
              </div>
            </div>
            <div className="max-h-[240px] overflow-y-auto scrollbar-thin">
              {filtered.length === 0 ? (
                <div className="px-3 py-6 text-center text-xs text-[#8a9aaa]">
                  Không tìm thấy depot nào
                </div>
              ) : (
                filtered.map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => {
                      onChange(d.id);
                      setOpen(false);
                      setKw('');
                    }}
                    className={`w-full flex items-center justify-between gap-2 px-3 py-2 text-left text-xs hover:bg-[#eef2f6] cursor-pointer ${
                      value === d.id ? 'bg-[#dce8f0]' : ''
                    }`}
                  >
                    <span className="flex items-center gap-1.5 min-w-0">
                      <MapPin size={11} className="text-[#2e7d5a] flex-shrink-0" />
                      <span className="truncate font-medium text-[#1a2332]">{d.stop_name}</span>
                    </span>
                    <span className="text-[10px] text-[#8a9aaa] font-mono flex-shrink-0">{d.stop_id}</span>
                  </button>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export function DepotSelector({ depots, startId, endId, onStartChange, onEndChange }) {
  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <div className="flex items-center gap-1.5">
          <span className="w-5 h-5 rounded-full bg-[#2e7d5a] text-white text-[10px] font-bold flex items-center justify-center">
            Đ
          </span>
          <span className="text-xs font-semibold text-[#4a5a7a]">Điểm đầu (Depot)</span>
        </div>
        <DepotPicker
          depots={depots}
          value={startId}
          onChange={onStartChange}
          placeholder="Chọn điểm đầu"
        />
      </div>

      <div className="space-y-1">
        <div className="flex items-center gap-1.5">
          <span className="w-5 h-5 rounded-full bg-[#c0392b] text-white text-[10px] font-bold flex items-center justify-center">
            C
          </span>
          <span className="text-xs font-semibold text-[#4a5a7a]">Điểm cuối (Depot)</span>
        </div>
        <DepotPicker
          depots={depots}
          value={endId}
          onChange={onEndChange}
          placeholder="Chọn điểm cuối"
          disabled={!startId}
        />
      </div>

      {startId && endId && startId === endId && (
        <div className="text-[11px] text-[#c0392b] bg-[#fde8e8] border border-[#f5b7b1] rounded px-2 py-1.5">
          ⚠ Điểm đầu và điểm cuối phải khác nhau
        </div>
      )}
    </div>
  );
}

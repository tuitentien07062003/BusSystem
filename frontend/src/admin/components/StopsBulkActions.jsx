import { CheckCircle2, XCircle, X } from 'lucide-react';

export function StopsBulkActions({
  count,
  onActivate,
  onDeactivate,
  onClear,
  isLoading,
}) {
  if (count === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40">
      <div className="bg-[#1a2332] text-white rounded-full shadow-2xl flex items-center gap-1 pl-4 pr-1.5 py-1.5 border border-[#2d3a52]">
        <span className="text-xs font-semibold mr-2">
          Đã chọn <b className="text-[#169BA2]">{count}</b> trạm
        </span>

        <button
          onClick={onActivate}
          disabled={isLoading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-[#b2e0c0] hover:bg-[#169BA2] hover:text-white transition-colors disabled:opacity-50 cursor-pointer"
        >
          <CheckCircle2 size={13} />
          Kích hoạt
        </button>

        <button
          onClick={onDeactivate}
          disabled={isLoading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-[#f5b7b1] hover:bg-[#c0392b] hover:text-white transition-colors disabled:opacity-50 cursor-pointer"
        >
          <XCircle size={13} />
          Ngưng
        </button>

        <div className="w-px h-5 bg-[#2d3a52] mx-1" />

        <button
          onClick={onClear}
          title="Bỏ chọn"
          className="w-7 h-7 rounded-full flex items-center justify-center text-[#8a9aaa] hover:bg-[#2d3a52] hover:text-white cursor-pointer"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}

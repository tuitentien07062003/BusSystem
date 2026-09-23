import { ChevronLeft, ChevronRight } from 'lucide-react';

export function StopsPagination({ page, totalPages, total, limit, onChange }) {
  if (totalPages <= 1) return null;

  const from = (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
      <div className="text-xs text-[#6a7a9a]">
        Hiển thị <b className="text-[#1a2332]">{from}</b>–
        <b className="text-[#1a2332]">{to}</b> /{' '}
        <b className="text-[#1a2332]">{total.toLocaleString('vi-VN')}</b> trạm
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => onChange(page - 1)}
          disabled={page <= 1}
          className="h-8 px-3 rounded-md border border-[#cbd5e1] bg-white text-xs font-semibold text-[#4a5a7a] hover:bg-[#eef2f6] disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 cursor-pointer"
        >
          <ChevronLeft size={14} />
          Trước
        </button>

        <span className="text-xs font-semibold text-[#1a2332] px-2">
          Trang {page} / {totalPages}
        </span>

        <button
          onClick={() => onChange(page + 1)}
          disabled={page >= totalPages}
          className="h-8 px-3 rounded-md border border-[#cbd5e1] bg-white text-xs font-semibold text-[#4a5a7a] hover:bg-[#eef2f6] disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 cursor-pointer"
        >
          Sau
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}

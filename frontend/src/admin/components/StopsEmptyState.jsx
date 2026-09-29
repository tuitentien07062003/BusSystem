import { Inbox, SearchX, RotateCcw } from 'lucide-react';

export function StopsEmptyState({ hasFilter, onReset }) {
  const Icon = hasFilter ? SearchX : Inbox;
  const title = hasFilter ? 'Không tìm thấy trạm nào' : 'Chưa có trạm nào';
  const desc = hasFilter
    ? 'Thử đổi từ khoá tìm kiếm hoặc bộ lọc trạng thái.'
    : 'Danh sách trạm sẽ hiển thị ở đây khi có dữ liệu.';

  return (
    <div className="bg-white rounded-lg border border-dashed border-[#d0d7e2] py-16 px-6 flex flex-col items-center text-center">
      <div className="w-16 h-16 rounded-full bg-[#eef2f6] flex items-center justify-center mb-4">
        <Icon size={28} className="text-[#8a9aaa]" />
      </div>
      <h3 className="text-base font-bold text-[#1a2332] mb-1">{title}</h3>
      <p className="text-sm text-[#6a7a9a] max-w-md mb-4">{desc}</p>

      {hasFilter && (
        <button
          onClick={onReset}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-[#cbd5e1] bg-white text-xs font-semibold text-[#169BA2] hover:bg-[#eef2f6] cursor-pointer"
        >
          <RotateCcw size={12} />
          Xoá bộ lọc
        </button>
      )}
    </div>
  );
}

import { ArrowRight, Eye, Trash2 } from "lucide-react";
import { EmployeeAvatar } from "../employees/EmployeeAvatar";
import { getSwapStatusStyle, fmtDate, fmtTime } from "./swapConstants";

function SwapRow({ swap, onView, onDelete, isDeleting }) {
  const statusStyle = getSwapStatusStyle(swap.status);
  const original = swap.original_employee;
  const substitute = swap.substitute_employee;

  return (
    <div className="group bg-white rounded-xl border border-[#E5EAF0] hover:border-[#A8D5D8] hover:shadow-sm transition-all p-4">
      <div className="flex items-center gap-4">
        <div className="flex-shrink-0 w-14 text-center">
          <div className="text-[10px] font-bold uppercase tracking-wider text-[#8A9AAA]">
            Ngày
          </div>
          <div className="text-base font-bold text-[#1A2332] font-mono leading-tight">
            {fmtDate(swap.swap_date).split("/").slice(0, 2).join("/")}
          </div>
        </div>

        <div className="w-px h-10 bg-[#F0F3F7]" />

        <div className="flex-1 flex items-center gap-3 min-w-0">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <EmployeeAvatar employee={original} size="sm" />
            <div className="min-w-0">
              <div className="text-xs text-[#8A9AAA] mb-0.5">Người bị thay</div>
              <div className="text-sm font-semibold text-[#1A2332] truncate">
                {original?.full_name || "—"}
              </div>
              <div className="text-[10px] text-[#8A9AAA] font-mono">
                {original?.employee_code}
              </div>
            </div>
          </div>

          <div className="flex-shrink-0 px-2">
            <div className="w-8 h-8 rounded-full bg-[#F3E8FF] flex items-center justify-center">
              <ArrowRight size={14} className="text-[#9333EA]" />
            </div>
          </div>

          <div className="flex items-center gap-2 min-w-0 flex-1">
            <EmployeeAvatar employee={substitute} size="sm" />
            <div className="min-w-0">
              <div className="text-xs text-[#8A9AAA] mb-0.5">Người thay</div>
              <div className="text-sm font-semibold text-[#1A2332] truncate">
                {substitute?.full_name || "—"}
              </div>
              <div className="text-[10px] text-[#8A9AAA] font-mono">
                {substitute?.employee_code}
              </div>
            </div>
          </div>
        </div>

        <div className="hidden lg:flex flex-col items-end gap-1.5 flex-shrink-0 min-w-[180px]">
          <span
            className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${statusStyle.dot}`} />
            {statusStyle.label}
          </span>

          {swap.assignment && (
            <div className="text-[11px] text-[#6A7A9A] font-mono">
              {fmtTime(swap.assignment.start_time)}–
              {fmtTime(swap.assignment.end_time)}
            </div>
          )}
        </div>

        <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            type="button"
            onClick={() => onView(swap)}
            title="Xem chi tiết"
            className="w-7 h-7 rounded-md hover:bg-[#F8FAFC] flex items-center justify-center cursor-pointer"
          >
            <Eye size={13} className="text-[#6A7A9A]" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(swap)}
            disabled={isDeleting}
            title="Xóa"
            className="w-7 h-7 rounded-md hover:bg-[#FEF2F2] flex items-center justify-center cursor-pointer disabled:opacity-50"
          >
            <Trash2 size={13} className="text-[#C62828]" />
          </button>
        </div>
      </div>

      {swap.reason && (
        <div className="mt-2.5 pt-2.5 border-t border-[#F0F3F7] text-xs text-[#6A7A9A] leading-relaxed line-clamp-2">
          <span className="font-semibold text-[#4A5A7A]">Lý do:</span>{" "}
          {swap.reason}
        </div>
      )}
    </div>
  );
}

export function SwapTable({ swaps, isLoading, onView, onDelete, isDeleting }) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-[#E5EAF0] py-16 flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#9333EA] border-t-transparent mb-3" />
        <p className="text-xs text-[#8A9AAA]">Đang tải danh sách swap...</p>
      </div>
    );
  }

  if (!swaps || swaps.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-dashed border-[#D0D7E2] py-16 px-6 flex flex-col items-center text-center">
        <div className="w-16 h-16 rounded-full bg-[#F8FAFC] flex items-center justify-center mb-4">
          <ArrowRight size={26} className="text-[#B0BCCA]" />
        </div>
        <h3 className="text-sm font-bold text-[#1A2332] mb-1">
          Chưa có lượt đổi ca nào
        </h3>
        <p className="text-xs text-[#8A9AAA] max-w-sm">
          Các lượt đổi ca sẽ hiện ở đây sau khi được tạo từ nút "Tạo swap"
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {swaps.map((s) => (
        <SwapRow
          key={s.id}
          swap={s}
          onView={onView}
          onDelete={onDelete}
          isDeleting={isDeleting}
        />
      ))}
    </div>
  );
}

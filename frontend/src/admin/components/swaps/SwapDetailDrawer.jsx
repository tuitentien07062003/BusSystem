import { useEffect } from "react";
import {
  X,
  ArrowRight,
  User as UserIcon,
  Calendar,
  Clock,
  Route as RouteIcon,
  Bus,
  Trash2,
} from "lucide-react";
import { EmployeeAvatar } from "../employees/EmployeeAvatar";
import { getSwapStatusStyle, fmtDateFull, fmtTime } from "./swapConstants";
import { useDeleteSwap } from "@/hooks/useShiftSwaps";

function Section({ icon: Icon, title, children }) {
  return (
    <div className="border-b border-[#F0F3F7] last:border-0">
      <div className="flex items-center gap-2 px-5 py-3">
        <div className="w-6 h-6 rounded-md bg-[#F8FAFC] flex items-center justify-center">
          <Icon size={12} className="text-[#8A9AAA]" />
        </div>
        <h3 className="text-[10px] font-bold uppercase tracking-wider text-[#6A7A9A]">
          {title}
        </h3>
      </div>
      <div className="px-5 pb-4">{children}</div>
    </div>
  );
}

function PersonCard({ employee, roleLabel, tone = "danger" }) {
  const tones = {
    danger: "border-[#FFC8C8] bg-[#FEF2F2]",
    success: "border-[#A8D5A8] bg-[#F1F8F1]",
  };
  const textTones = {
    danger: "text-[#C62828]",
    success: "text-[#2E7D32]",
  };

  if (!employee) return null;

  return (
    <div className={`rounded-lg border ${tones[tone]} p-3`}>
      <div
        className={`text-[10px] font-bold uppercase tracking-wider mb-2 ${textTones[tone]}`}
      >
        {roleLabel}
      </div>
      <div className="flex items-center gap-3">
        <EmployeeAvatar employee={employee} size="md" />
        <div className="min-w-0">
          <div className="text-sm font-bold text-[#1A2332] truncate">
            {employee.full_name}
          </div>
          <div className="text-[11px] text-[#8A9AAA] font-mono mt-0.5">
            {employee.employee_code}
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center justify-between gap-3 py-1.5">
      <div className="flex items-center gap-2">
        <Icon size={11} className="text-[#8A9AAA]" />
        <span className="text-[11px] text-[#6A7A9A]">{label}</span>
      </div>
      <span className="text-xs font-medium text-[#1A2332]">{value}</span>
    </div>
  );
}

export function SwapDetailDrawer({ swap, open, onClose }) {
  const deleteMut = useDeleteSwap();

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || !swap) return null;

  const statusStyle = getSwapStatusStyle(swap.status);

  const handleDelete = () => {
    if (!confirm("Xóa bản ghi swap này? Thao tác không hoàn tác.")) return;
    deleteMut.mutate(swap.id, {
      onSuccess: () => onClose?.(),
    });
  };

  return (
    <>
      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-[1px] z-[1000] animate-in fade-in"
        onClick={onClose}
      />
      <div
        className="fixed top-0 right-0 h-screen w-full max-w-[520px] bg-white shadow-2xl z-[1010] flex flex-col animate-in slide-in-from-right"
        style={{ animationDuration: "0.25s" }}
      >
        <header className="flex-shrink-0 border-b border-[#E5EAF0]">
          <div className="h-1 bg-[#9333EA]" />
          <div className="px-5 py-4">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-xl bg-[#F3E8FF] flex items-center justify-center flex-shrink-0">
                <ArrowRight size={20} className="text-[#9333EA]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-base font-bold text-[#1A2332]">
                    Đổi ca #{swap.id}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${statusStyle.dot}`}
                    />
                    {statusStyle.label}
                  </span>
                </div>
                <div className="text-[11px] text-[#6A7A9A]">
                  {fmtDateFull(swap.swap_date)}
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-md hover:bg-[#F8FAFC] flex items-center justify-center cursor-pointer flex-shrink-0"
              >
                <X size={16} className="text-[#6A7A9A]" />
              </button>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto scrollbar-thin">
          <Section icon={UserIcon} title="Thay đổi tài xế">
            <div className="space-y-2">
              <PersonCard
                employee={swap.original_employee}
                roleLabel="Người bị thay"
                tone="danger"
              />
              <div className="flex justify-center">
                <div className="w-7 h-7 rounded-full bg-[#F3E8FF] flex items-center justify-center">
                  <ArrowRight size={12} className="text-[#9333EA]" />
                </div>
              </div>
              <PersonCard
                employee={swap.substitute_employee}
                roleLabel="Người thay thế"
                tone="success"
              />
            </div>
          </Section>

          {swap.assignment && (
            <Section icon={Bus} title="Ca chạy được swap">
              <div className="space-y-1">
                <DetailRow
                  icon={Calendar}
                  label="Ngày"
                  value={fmtDateFull(swap.assignment.date)}
                />
                <DetailRow
                  icon={RouteIcon}
                  label="Tuyến"
                  value={`#${swap.assignment.route_id}`}
                />
                <DetailRow
                  icon={Clock}
                  label="Khung giờ"
                  value={`${fmtTime(swap.assignment.start_time)} – ${fmtTime(swap.assignment.end_time)}`}
                />
              </div>
            </Section>
          )}

          {swap.reason && (
            <Section icon={UserIcon} title="Lý do">
              <div className="text-xs text-[#4A5A7A] leading-relaxed bg-[#F8FAFC] rounded-md p-3">
                {swap.reason}
              </div>
            </Section>
          )}
        </div>

        <footer className="flex-shrink-0 border-t border-[#E5EAF0] bg-[#F8FAFC] p-4">
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleteMut.isPending}
            className="w-full h-10 rounded-lg border border-[#FFC8C8] bg-white text-[#C62828] hover:bg-[#FEF2F2] text-sm font-semibold cursor-pointer inline-flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {deleteMut.isPending ? (
              "Đang xóa..."
            ) : (
              <>
                <Trash2 size={14} />
                Xóa bản ghi swap
              </>
            )}
          </button>
        </footer>
      </div>
    </>
  );
}

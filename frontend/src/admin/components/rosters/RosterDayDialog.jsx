import { useState, useMemo, useEffect } from "react";
import {
  X,
  Loader2,
  AlertTriangle,
  User as UserIcon,
  ArrowRight,
} from "lucide-react";
import { EmployeeAvatar } from "../employees/EmployeeAvatar";
import { getShiftStyle } from "./rosterConstants";
import { useUpdateRoster } from "@/hooks/useRosters";
import { useActiveShiftTemplates } from "@/hooks/useShiftTemplates";

const WEEKDAY_LABELS = [
  "Chủ nhật",
  "Thứ 2",
  "Thứ 3",
  "Thứ 4",
  "Thứ 5",
  "Thứ 6",
  "Thứ 7",
];

function fmtDateFull(dateStr) {
  if (!dateStr) return "—";
  try {
    const d = new Date(dateStr);
    const dow = WEEKDAY_LABELS[d.getDay()];
    const p = (n) => String(n).padStart(2, "0");
    return `${dow}, ${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()}`;
  } catch {
    return dateStr;
  }
}

// ─── Shift badge ───
function ShiftBadge({ shiftCode, status, size = "md" }) {
  const style = getShiftStyle(shiftCode, status);
  const sizes = {
    sm: "px-2 py-0.5 text-[10px]",
    md: "px-2.5 py-1 text-xs",
  };
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md font-bold ${style.bgLight} ${style.textDark} border ${style.border} ${sizes[size]}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${style.bg}`} />
      {style.label}
    </span>
  );
}

// ─── Row 1 nhân viên ───
function EmployeeRow({ employee, roster, shifts, onShiftChange, isUpdating }) {
  const [menuOpen, setMenuOpen] = useState(false);

  const currentShiftId = roster?.shift_template_id;

  const handlePick = (shiftId) => {
    setMenuOpen(false);
    if (shiftId === currentShiftId) return;
    onShiftChange(roster.id, shiftId);
  };

  return (
    <div className="flex items-center gap-3 px-4 py-3 hover:bg-[#F8FAFC] transition-colors border-b border-[#F0F3F7] last:border-0">
      <EmployeeAvatar employee={employee} size="sm" />

      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-[#1A2332] truncate">
          {employee.full_name}
        </div>
        <div className="text-[11px] text-[#8A9AAA] font-mono mt-0.5">
          {employee.employee_code}
        </div>
      </div>

      {roster && (
        <ShiftBadge shiftCode={roster.shift?.code} status={roster.status} />
      )}

      <div className="relative flex-shrink-0">
        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          disabled={isUpdating || !roster}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold text-[#169BA2] bg-[#E6F4F5] hover:bg-[#A8D5D8] transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isUpdating ? (
            <Loader2 size={11} className="animate-spin" />
          ) : (
            <ArrowRight size={11} />
          )}
          Đổi ca
        </button>

        {menuOpen && (
          <>
            <div
              className="fixed inset-0 z-[1020]"
              onClick={() => setMenuOpen(false)}
            />
            <div className="absolute right-0 top-full mt-1 w-[240px] bg-white rounded-lg border border-[#E5EAF0] shadow-xl z-[1030] overflow-hidden">
              <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-[#8A9AAA] bg-[#F8FAFC] border-b border-[#E5EAF0]">
                Chọn ca mới
              </div>
              {shifts.map((s) => {
                const isCurrent = s.id === currentShiftId;
                const style = getShiftStyle(s.code, "scheduled");
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => handlePick(s.id)}
                    disabled={isCurrent}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 text-left cursor-pointer transition-colors ${
                      isCurrent
                        ? "bg-[#F8FAFC] cursor-not-allowed"
                        : "hover:bg-[#F8FAFC]"
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full flex-shrink-0 ${style.bg}`}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold text-[#1A2332] truncate">
                        {s.name}
                      </div>
                      <div className="text-[10px] text-[#8A9AAA] font-mono">
                        {String(s.drive_start).slice(0, 5)} –{" "}
                        {String(s.drive_end).slice(0, 5)}
                      </div>
                    </div>
                    {isCurrent && (
                      <span className="text-[9px] font-bold text-[#169BA2]">
                        HIỆN TẠI
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// MAIN DIALOG
// ═══════════════════════════════════════════════════════════════
export function RosterDayDialog({
  open,
  subGroup,
  date,
  rosters = [],
  onClose,
}) {
  const [pendingForce, setPendingForce] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);

  const updateMut = useUpdateRoster();
  const { data: shiftsData } = useActiveShiftTemplates();
  const shifts = shiftsData?.data || [];

  const employees = subGroup?.employees || [];

  // Roster của sub-group ngày này
  const rostersByEmp = useMemo(() => {
    const empIds = new Set(employees.map((e) => e.id));
    const map = new Map();
    rosters.forEach((r) => {
      if (!empIds.has(r.employee_id) || r.date !== date) return;
      map.set(r.employee_id, r);
    });
    return map;
  }, [employees, rosters, date]);

  // Stats
  const stats = useMemo(() => {
    let morning = 0,
      evening = 0,
      off = 0,
      other = 0;
    rostersByEmp.forEach((r) => {
      if (r.status === "off") off++;
      else if (r.shift?.code === "MORNING") morning++;
      else if (r.shift?.code === "EVENING") evening++;
      else other++;
    });
    return { morning, evening, off, other };
  }, [rostersByEmp]);

  // Reset khi đóng
  useEffect(() => {
    if (!open) {
      setPendingForce(null);
      setUpdatingId(null);
    }
  }, [open]);

  const hasNoRoster = employees.length > 0 && rostersByEmp.size === 0;

  if (!open || !subGroup) return null;

  const handleShiftChange = async (rosterId, newShiftId, force = false) => {
    setUpdatingId(rosterId);
    try {
      await updateMut.mutateAsync({
        id: rosterId,
        payload: {
          shift_template_id: newShiftId,
          ...(force ? { force: true } : {}),
        },
      });
      setPendingForce(null);
    } catch (err) {
      if (err?.response?.status === 409) {
        setPendingForce({ rosterId, newShiftId, error: err });
      }
    } finally {
      setUpdatingId(null);
    }
  };

  const handleForceConfirm = () => {
    if (!pendingForce) return;
    handleShiftChange(pendingForce.rosterId, pendingForce.newShiftId, true);
  };

  return (
    <>
      <div
        className="fixed inset-0 bg-black/40 z-[1000] animate-in fade-in"
        onClick={onClose}
      />
      <div
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[1010] bg-white rounded-2xl shadow-2xl w-full max-w-[640px] max-h-[85vh] flex flex-col animate-in zoom-in-95"
        style={{ animationDuration: "0.2s" }}
      >
        {/* Header */}
        <header className="flex-shrink-0 border-b border-[#E5EAF0] px-5 py-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#169BA2]" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#8A9AAA]">
                  Nhóm {subGroup.name} · {subGroup.roleLabel}
                </span>
              </div>
              <h2 className="text-base font-bold text-[#1A2332] mt-1">
                {fmtDateFull(date)}
              </h2>
              <div className="flex items-center gap-3 mt-2 text-[11px] text-[#6A7A9A]">
                <span className="inline-flex items-center gap-1">
                  <UserIcon size={11} />
                  {employees.length} nhân viên
                </span>
                {stats.morning > 0 && (
                  <span className="inline-flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-[#169BA2]" />
                    {stats.morning} ca sáng
                  </span>
                )}
                {stats.evening > 0 && (
                  <span className="inline-flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-[#9333EA]" />
                    {stats.evening} ca tối
                  </span>
                )}
                {stats.off > 0 && (
                  <span className="inline-flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-[#8A9AAA]" />
                    {stats.off} nghỉ
                  </span>
                )}
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
        </header>

        {/* Body */}
        <div className="flex-1 overflow-y-auto scrollbar-thin">
          {hasNoRoster ? (
            <div className="py-16 px-6 text-center">
              <div className="w-14 h-14 rounded-full bg-[#F8FAFC] flex items-center justify-center mx-auto mb-3">
                <AlertTriangle size={22} className="text-[#B0BCCA]" />
              </div>
              <div className="text-sm font-bold text-[#1A2332] mb-1">
                Chưa có Roster cho ngày này
              </div>
              <p className="text-xs text-[#8A9AAA] max-w-sm mx-auto">
                Cần tạo lịch phân ca trước khi có thể đổi ca.
              </p>
            </div>
          ) : (
            <div>
              {employees.map((emp) => {
                const roster = rostersByEmp.get(emp.id);
                return (
                  <EmployeeRow
                    key={emp.id}
                    employee={emp}
                    roster={roster}
                    shifts={shifts}
                    onShiftChange={handleShiftChange}
                    isUpdating={updatingId === roster?.id}
                  />
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="flex-shrink-0 border-t border-[#E5EAF0] px-5 py-3 bg-[#F8FAFC] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="h-9 px-4 rounded-md border border-[#D0D7E2] bg-white hover:bg-[#F8FAFC] text-xs font-semibold text-[#4A5A7A] cursor-pointer"
          >
            Đóng
          </button>
        </footer>
      </div>

      {/* Force confirm */}
      {pendingForce && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-[1040]"
            onClick={() => setPendingForce(null)}
          />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[1050] bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="px-5 py-4 border-b border-[#E5EAF0] flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#FEF3E2] flex items-center justify-center flex-shrink-0">
                <AlertTriangle size={18} className="text-[#E08940]" />
              </div>
              <div>
                <div className="text-sm font-bold text-[#1A2332]">
                  Vi phạm ràng buộc 11h nghỉ
                </div>
                <div className="text-[11px] text-[#8A9AAA] mt-0.5">
                  Bạn có chắc chắn muốn áp dụng?
                </div>
              </div>
            </div>
            <div className="px-5 py-4">
              <div className="text-xs text-[#4A5A7A] leading-relaxed bg-[#FEF3E2] border border-[#FCD9A0] rounded-md p-3">
                {pendingForce.error?.response?.data?.error ||
                  "Nhân viên sẽ có thời gian nghỉ dưới 11h giữa 2 ca."}
              </div>
              <div className="text-[11px] text-[#8A9AAA] mt-3">
                Chỉ áp dụng trong trường hợp khẩn cấp. Hệ thống sẽ ghi log lại
                thao tác này.
              </div>
            </div>
            <div className="px-5 py-3 border-t border-[#E5EAF0] bg-[#F8FAFC] flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setPendingForce(null)}
                className="h-9 px-4 rounded-md border border-[#D0D7E2] bg-white hover:bg-[#F8FAFC] text-xs font-semibold text-[#4A5A7A] cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleForceConfirm}
                disabled={updateMut.isPending}
                className="h-9 px-4 rounded-md bg-[#E08940] hover:bg-[#C77A32] text-white text-xs font-semibold cursor-pointer disabled:opacity-50 inline-flex items-center gap-1.5"
              >
                {updateMut.isPending ? (
                  <>
                    <Loader2 size={12} className="animate-spin" />
                    Đang lưu...
                  </>
                ) : (
                  "Vẫn áp dụng"
                )}
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}

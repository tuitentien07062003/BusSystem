import { useState, useEffect, useMemo } from "react";
import {
  X,
  Loader2,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Search,
  Bus,
  Clock,
  User as UserIcon,
  Award,
  Calendar,
} from "lucide-react";
import { EmployeeAvatar } from "../employees/EmployeeAvatar";
import { useSuggestSubstitutes, useCreateSwap } from "@/hooks/useShiftSwaps";
import { useAssignmentsList } from "@/hooks/useAssignments";
import { fmtDateShort, fmtTime, todayStr } from "./swapConstants";

const STEPS = [
  { id: 1, label: "Chọn ca chạy" },
  { id: 2, label: "Chọn người thay" },
];

// ═══════════════════════════════════════════════════════════════
// STEP 1 — Chọn assignment
// ═══════════════════════════════════════════════════════════════
function Step1({
  date,
  onDateChange,
  onPickAssignment,
  searchInput,
  onSearchChange,
}) {
  const { data, isLoading } = useAssignmentsList({
    date,
    limit: 200,
  });

  const assignments = useMemo(() => {
    const list = data?.data || [];
    if (!searchInput.trim()) return list;
    const kw = searchInput.toLowerCase();
    return list.filter(
      (a) =>
        a.driver?.employee_code?.toLowerCase().includes(kw) ||
        a.driver?.full_name?.toLowerCase().includes(kw) ||
        a.vehicle?.vehicle_code?.toLowerCase().includes(kw),
    );
  }, [data, searchInput]);

  return (
    <div className="p-6 space-y-4">
      {/* Date + search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg bg-[#F3E8FF] flex items-center justify-center flex-shrink-0">
            <Calendar size={14} className="text-[#9333EA]" />
          </div>
          <input
            type="date"
            value={date}
            onChange={(e) => onDateChange(e.target.value)}
            className="h-10 px-3.5 rounded-lg border border-[#D0D7E2] bg-white text-sm font-mono text-[#1A2332] outline-none focus:border-[#9333EA] focus:ring-2 focus:ring-[#9333EA]/20 cursor-pointer"
          />
        </div>

        <div className="relative flex-1">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8A9AAA] pointer-events-none"
          />
          <input
            value={searchInput}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Tìm theo mã/tên tài xế, mã xe..."
            className="w-full h-10 pl-9 pr-3 rounded-lg border border-[#D0D7E2] bg-white text-sm text-[#1A2332] placeholder:text-[#B0BCCA] outline-none focus:border-[#9333EA] focus:ring-2 focus:ring-[#9333EA]/20"
          />
        </div>
      </div>

      {/* Assignment list */}
      <div className="space-y-2 max-h-[420px] overflow-y-auto scrollbar-thin pr-1">
        {isLoading ? (
          <div className="py-16 flex flex-col items-center justify-center">
            <Loader2 size={20} className="animate-spin text-[#9333EA] mb-2" />
            <p className="text-xs text-[#8A9AAA]">Đang tải phân công...</p>
          </div>
        ) : assignments.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[#D0D7E2] py-12 text-center">
            <div className="w-12 h-12 rounded-full bg-[#F8FAFC] flex items-center justify-center mx-auto mb-3">
              <Bus size={20} className="text-[#B0BCCA]" />
            </div>
            <div className="text-sm font-medium text-[#4A5A7A] mb-1">
              Không có phân công nào
            </div>
            <div className="text-xs text-[#8A9AAA]">
              {date
                ? `Ngày ${fmtDateShort(date)} chưa có phân công`
                : "Chọn ngày khác"}
            </div>
          </div>
        ) : (
          assignments.map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => onPickAssignment(a)}
              className="w-full text-left rounded-xl border border-[#E5EAF0] bg-white hover:border-[#9333EA] hover:shadow-sm p-3.5 transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#F3E8FF] flex items-center justify-center flex-shrink-0">
                  <Bus size={16} className="text-[#9333EA]" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-bold text-[#1A2332] font-mono">
                      {a.vehicle?.vehicle_code || `#${a.vehicle_id}`}
                    </span>
                    <span className="text-[10px] text-[#8A9AAA] font-mono">
                      {a.vehicle?.license_plate}
                    </span>
                  </div>
                  <div className="text-xs text-[#6A7A9A] truncate">
                    {a.driver?.full_name || "—"}
                    {a.driver?.employee_code && (
                      <span className="text-[#8A9AAA] font-mono ml-1.5">
                        ({a.driver.employee_code})
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-[10px] text-[#8A9AAA]">
                    <span className="font-mono">
                      {fmtTime(a.start_time)} – {fmtTime(a.end_time)}
                    </span>
                    <span>·</span>
                    <span>Tuyến #{a.route_id}</span>
                  </div>
                </div>

                <ArrowRight
                  size={14}
                  className="text-[#B0BCCA] group-hover:text-[#9333EA] transition-colors flex-shrink-0"
                />
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// STEP 2 — Chọn người thay
// ═══════════════════════════════════════════════════════════════
function Step2({
  assignment,
  suggestData,
  reason,
  onReasonChange,
  pickedDriverId,
  onPickDriver,
  isLoading,
  onBack,
  onSubmit,
  isSubmitting,
}) {
  if (isLoading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center">
        <Loader2 size={24} className="animate-spin text-[#9333EA] mb-3" />
        <p className="text-xs text-[#8A9AAA]">Đang tìm người thay thế...</p>
      </div>
    );
  }

  if (!suggestData) {
    return (
      <div className="p-6 py-16 text-center">
        <p className="text-sm text-[#8A9AAA]">Không tải được gợi ý</p>
        <button
          onClick={onBack}
          className="mt-3 text-xs font-semibold text-[#9333EA] cursor-pointer"
        >
          Chọn lại
        </button>
      </div>
    );
  }

  const eligible = suggestData.eligible || [];
  const assignmentInfo = suggestData.assignment || {};

  return (
    <div className="p-6 space-y-4">
      {/* Assignment summary */}
      <div className="rounded-xl border border-[#E5EAF0] bg-white p-3.5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#FEF2F2] flex items-center justify-center flex-shrink-0">
            <Bus size={16} className="text-[#C62828]" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs text-[#8A9AAA] mb-0.5">
              Ca chạy cần thay
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-[#1A2332] font-mono">
                {assignmentInfo.vehicle_code}
              </span>
              <span className="text-[11px] text-[#6A7A9A]">
                {assignmentInfo.shift_code === "MORNING" ? "Ca sáng" : "Ca tối"}
              </span>
            </div>
            <div className="text-[11px] text-[#8A9AAA] mt-0.5">
              {fmtTime(assignmentInfo.start_time)} –{" "}
              {fmtTime(assignmentInfo.end_time)} · Tuyến #
              {assignmentInfo.route_id}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <EmployeeAvatar
              employee={assignmentInfo.original_driver}
              size="sm"
            />
            <div className="min-w-0 hidden sm:block">
              <div className="text-xs font-semibold text-[#1A2332] truncate">
                {assignmentInfo.original_driver?.full_name}
              </div>
              <div className="text-[10px] text-[#8A9AAA] font-mono">
                {assignmentInfo.original_driver?.employee_code}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Eligible drivers */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2">
            <Sparkles size={13} className="text-[#2E7D32]" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#4A5A7A]">
              Người có thể thay
            </span>
          </div>
          <span className="text-[10px] font-semibold text-[#2E7D32] bg-[#F1F8F1] px-2 py-0.5 rounded-full border border-[#A8D5A8]">
            {eligible.length} người
          </span>
        </div>

        {eligible.length === 0 ? (
          <div className="rounded-xl border border-[#FCD9A0] bg-[#FEF3E2] p-4 flex items-start gap-2">
            <AlertTriangle
              size={14}
              className="text-[#B45309] flex-shrink-0 mt-0.5"
            />
            <div className="text-xs text-[#B45309]">
              Không tìm được ai có thể thay. Cần xử lý thủ công (đổi ca khác,
              hủy chuyến).
            </div>
          </div>
        ) : (
          <div className="space-y-2 max-h-[280px] overflow-y-auto scrollbar-thin pr-1">
            {eligible.map((item) => {
              const d = item.driver;
              const isPicked = pickedDriverId === d.id;
              return (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => onPickDriver(d.id)}
                  className={`w-full text-left rounded-xl border-2 p-3 transition-all cursor-pointer ${
                    isPicked
                      ? "border-[#9333EA] bg-[#F3E8FF] shadow-sm"
                      : "border-[#E5EAF0] bg-white hover:border-[#A8D5A8]"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <EmployeeAvatar employee={d} size="md" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-[#1A2332] truncate">
                          {d.full_name}
                        </span>
                        {isPicked && (
                          <CheckCircle2
                            size={14}
                            className="text-[#9333EA] flex-shrink-0"
                          />
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 text-[10px] text-[#8A9AAA]">
                        <span className="font-mono">{d.employee_code}</span>
                        {d.license_class && (
                          <>
                            <span>·</span>
                            <span className="inline-flex items-center gap-0.5">
                              <Award size={9} />
                              Bằng {d.license_class}
                            </span>
                          </>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1.5 text-[10px]">
                        <span className="text-[#8A9AAA]">
                          Giờ tuần:{" "}
                          <b className="text-[#1A2332]">
                            {item.current_weekly_hours || 0}h
                          </b>
                        </span>
                        <span className="text-[#8A9AAA]">
                          Sau swap:{" "}
                          <b className="text-[#169BA2]">
                            {(
                              item.current_weekly_hours + item.new_shift_hours
                            ).toFixed(1)}
                            h
                          </b>
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Reason */}
      <div>
        <label className="text-[11px] font-bold uppercase tracking-wider text-[#6A7A9A] block mb-2">
          Lý do đổi ca <span className="text-[#C62828]">*</span>
        </label>
        <textarea
          value={reason}
          onChange={(e) => onReasonChange(e.target.value)}
          placeholder="VD: Tài xế báo ốm lúc 5h sáng, không thể chạy ca..."
          rows={2}
          className="w-full px-3 py-2 rounded-lg border border-[#D0D7E2] bg-white text-sm text-[#1A2332] placeholder:text-[#B0BCCA] outline-none focus:border-[#9333EA] focus:ring-2 focus:ring-[#9333EA]/20 resize-none"
        />
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// MAIN WIZARD
// ═══════════════════════════════════════════════════════════════
export function SwapWizardDialog({ open, onClose }) {
  const [step, setStep] = useState(1);
  const [date, setDate] = useState(todayStr());
  const [searchInput, setSearchInput] = useState("");
  const [pickedAssignment, setPickedAssignment] = useState(null);
  const [suggestData, setSuggestData] = useState(null);
  const [pickedDriverId, setPickedDriverId] = useState(null);
  const [reason, setReason] = useState("");

  const suggestMut = useSuggestSubstitutes();
  const createMut = useCreateSwap();

  // Reset khi đóng
  useEffect(() => {
    if (!open) {
      setStep(1);
      setDate(todayStr());
      setSearchInput("");
      setPickedAssignment(null);
      setSuggestData(null);
      setPickedDriverId(null);
      setReason("");
    }
  }, [open]);

  // ─── Pick assignment → gọi suggest ───
  const handlePickAssignment = async (a) => {
    setPickedAssignment(a);
    setStep(2);
    setSuggestData(null);
    try {
      const result = await suggestMut.mutateAsync(a.id);
      setSuggestData(result);
    } catch (err) {
      // toast đã show ở hook
    }
  };

  // ─── Back về step 1 ───
  const handleBack = () => {
    setStep(1);
    setPickedAssignment(null);
    setSuggestData(null);
    setPickedDriverId(null);
    setReason("");
  };

  // ─── Submit ───
  const handleSubmit = async () => {
    if (!pickedAssignment || !pickedDriverId) {
      alert("Vui lòng chọn người thay thế.");
      return;
    }
    if (!reason.trim()) {
      alert("Vui lòng nhập lý do đổi ca.");
      return;
    }
    try {
      await createMut.mutateAsync({
        assignment_id: pickedAssignment.id,
        substitute_employee_id: pickedDriverId,
        reason: reason.trim(),
      });
      onClose?.();
    } catch (err) {
      // toast đã show ở hook
    }
  };

  if (!open) return null;

  const canSubmit =
    pickedDriverId && reason.trim().length > 0 && !createMut.isPending;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/40 z-[1000] animate-in fade-in"
        onClick={onClose}
      />
      <div
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[1010] bg-white rounded-2xl shadow-2xl w-full max-w-[680px] max-h-[88vh] flex flex-col animate-in zoom-in-95"
        style={{ animationDuration: "0.2s" }}
      >
        {/* ═══ HEADER ═══ */}
        <header className="flex-shrink-0 border-b border-[#E5EAF0] px-6 py-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-[#1A2332]">
                Tạo đổi ca đột xuất
              </h2>
              <p className="text-[11px] text-[#8A9AAA] mt-0.5">
                {step === 1
                  ? "Chọn ca chạy cần thay người"
                  : "Chọn tài xế thay thế và nhập lý do"}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-md hover:bg-[#F8FAFC] flex items-center justify-center cursor-pointer flex-shrink-0"
            >
              <X size={16} className="text-[#6A7A9A]" />
            </button>
          </div>

          {/* Stepper */}
          <div className="flex items-center gap-2 mt-4">
            {STEPS.map((s, i) => {
              const isActive = step === s.id;
              const isDone = step > s.id;
              return (
                <div key={s.id} className="flex items-center gap-2 flex-1">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 transition-all ${
                      isDone
                        ? "bg-[#9333EA] text-white"
                        : isActive
                          ? "bg-[#9333EA] text-white ring-4 ring-[#9333EA]/15"
                          : "bg-[#F8FAFC] text-[#8A9AAA] border border-[#E5EAF0]"
                    }`}
                  >
                    {isDone ? <CheckCircle2 size={12} /> : s.id}
                  </div>
                  <span
                    className={`text-[11px] font-semibold ${
                      isActive || isDone ? "text-[#1A2332]" : "text-[#8A9AAA]"
                    }`}
                  >
                    {s.label}
                  </span>
                  {i < STEPS.length - 1 && (
                    <div
                      className={`flex-1 h-px ${
                        isDone ? "bg-[#9333EA]" : "bg-[#E5EAF0]"
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </header>

        {/* ═══ BODY ═══ */}
        <div className="flex-1 overflow-y-auto scrollbar-thin">
          {step === 1 && (
            <Step1
              date={date}
              onDateChange={setDate}
              onPickAssignment={handlePickAssignment}
              searchInput={searchInput}
              onSearchChange={setSearchInput}
            />
          )}
          {step === 2 && (
            <Step2
              assignment={pickedAssignment}
              suggestData={suggestData}
              reason={reason}
              onReasonChange={setReason}
              pickedDriverId={pickedDriverId}
              onPickDriver={setPickedDriverId}
              isLoading={suggestMut.isPending}
              onBack={handleBack}
              onSubmit={handleSubmit}
              isSubmitting={createMut.isPending}
            />
          )}
        </div>

        {/* ═══ FOOTER (step 2 only) ═══ */}
        {step === 2 && (
          <footer className="flex-shrink-0 border-t border-[#E5EAF0] bg-[#F8FAFC] px-6 py-4 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleBack}
              disabled={createMut.isPending}
              className="h-10 px-4 rounded-lg border border-[#D0D7E2] bg-white hover:bg-[#F8FAFC] text-sm font-semibold text-[#4A5A7A] cursor-pointer disabled:opacity-50"
            >
              Chọn lại
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={createMut.isPending}
                className="h-10 px-4 rounded-lg border border-[#D0D7E2] bg-white hover:bg-[#F8FAFC] text-sm font-semibold text-[#4A5A7A] cursor-pointer disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!canSubmit}
                className="h-10 px-5 rounded-lg bg-[#9333EA] hover:bg-[#7E22CE] text-white text-sm font-bold cursor-pointer inline-flex items-center gap-2 disabled:opacity-50 shadow-sm hover:shadow-md transition-all"
              >
                {createMut.isPending ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Đang swap...
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={14} />
                    Xác nhận đổi ca
                  </>
                )}
              </button>
            </div>
          </footer>
        )}
      </div>
    </>
  );
}

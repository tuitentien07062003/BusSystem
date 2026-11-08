import { useEffect, useState, useMemo } from "react";
import {
  X,
  Phone,
  Mail,
  IdCard,
  CalendarDays,
  AlertTriangle,
  Briefcase,
  Loader2,
  CheckCircle2,
  Info,
} from "lucide-react";
import { EmployeeAvatar } from "./EmployeeAvatar";
import {
  EMPLOYEE_TYPE_LABELS,
  EMPLOYEE_TYPE_STYLES,
  UNKNOWN,
} from "./employeeConstants";
import { useRostersByEmployee } from "@/hooks/useRosters";
import { useUnavailabilityList } from "@/hooks/useUnavailability";
import { useAssignmentsList } from "@/hooks/useAssignments";

// ─── Helper ───
function fmtDate(s) {
  if (!s) return UNKNOWN;
  try {
    return new Date(s).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return UNKNOWN;
  }
}

function fmtTime(t) {
  if (!t) return UNKNOWN;
  return String(t).slice(0, 5);
}

function fmtDateShort(s) {
  if (!s) return UNKNOWN;
  try {
    const d = new Date(s);
    return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
  } catch {
    return UNKNOWN;
  }
}

const WEEKDAY_LABELS = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

// ─── Tab: Tổng quan ───
function OverviewTab({ employee }) {
  const items = [
    { icon: Phone, label: "Số điện thoại", value: employee.phone || UNKNOWN },
    { icon: Mail, label: "Email", value: employee.email || UNKNOWN },
    {
      icon: IdCard,
      label: "Hạng bằng lái",
      value: employee.license_class || UNKNOWN,
    },
    {
      icon: IdCard,
      label: "Số bằng lái",
      value: employee.license_number || UNKNOWN,
    },
    {
      icon: CalendarDays,
      label: "Ngày hết hạn bằng",
      value: fmtDate(employee.license_expiry),
    },
    {
      icon: CalendarDays,
      label: "Ngày vào làm",
      value: fmtDate(employee.hire_date),
    },
  ];

  const showLicense =
    employee.type === "driver" || employee.type === "co_driver";

  const filtered = showLicense
    ? items
    : items.filter((i) => !i.label.includes("bằng"));

  return (
    <div className="space-y-1">
      {filtered.map((item, i) => (
        <div
          key={i}
          className="flex items-start gap-3 py-2.5 border-b border-[#F0F3F7] last:border-0"
        >
          <div className="w-8 h-8 rounded-lg bg-[#F8FAFC] flex items-center justify-center flex-shrink-0">
            <item.icon size={13} className="text-[#8A9AAA]" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-[#8A9AAA] mb-0.5">
              {item.label}
            </div>
            <div className="text-sm text-[#1A2332] font-medium truncate">
              {item.value}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Tab: Lịch tuần này ───
function ScheduleTab({ employee }) {
  const { from, to } = useMemo(() => {
    const today = new Date();
    const dow = (today.getDay() + 6) % 7; // Mon=0
    const monday = new Date(today);
    monday.setDate(monday.getDate() - dow);
    const sunday = new Date(monday);
    sunday.setDate(sunday.getDate() + 6);
    const p = (n) => String(n).padStart(2, "0");
    const fmt = (d) =>
      `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
    return { from: fmt(monday), to: fmt(sunday) };
  }, []);

  const { data, isLoading } = useRostersByEmployee(employee.id, { from, to });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 size={20} className="animate-spin text-[#169BA2]" />
      </div>
    );
  }

  const rosters = data?.data || [];

  if (rosters.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-12 h-12 rounded-full bg-[#F8FAFC] flex items-center justify-center mx-auto mb-3">
          <CalendarDays size={20} className="text-[#B0BCCA]" />
        </div>
        <div className="text-sm font-medium text-[#4A5A7A] mb-1">
          Chưa có lịch tuần này
        </div>
        <div className="text-xs text-[#8A9AAA]">
          Nhân viên chưa được phân ca trong tuần hiện tại
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {rosters.map((r) => {
        const dow = new Date(r.date).getDay();
        const isOff = r.status === "off" || r.status === "absent";
        return (
          <div
            key={r.id}
            className={`flex items-center gap-3 p-3 rounded-lg border ${
              isOff
                ? "bg-[#F8FAFC] border-[#E5EAF0]"
                : "bg-white border-[#E5EAF0]"
            }`}
          >
            <div className="text-center flex-shrink-0 w-10">
              <div className="text-[10px] font-bold uppercase tracking-wider text-[#8A9AAA]">
                {WEEKDAY_LABELS[dow]}
              </div>
              <div className="text-sm font-bold text-[#1A2332]">
                {fmtDateShort(r.date)}
              </div>
            </div>
            <div className="w-px h-8 bg-[#E5EAF0]" />
            <div className="flex-1 min-w-0">
              {isOff ? (
                <span className="text-xs text-[#8A9AAA]">
                  {r.status === "off" ? "Nghỉ" : "Vắng"}
                  {r.notes ? ` · ${r.notes}` : ""}
                </span>
              ) : (
                <>
                  <div className="text-xs font-bold text-[#1A2332]">
                    {r.shift?.name || UNKNOWN}
                  </div>
                  <div className="text-[10px] text-[#8A9AAA] font-mono mt-0.5">
                    {fmtTime(r.shift?.drive_start)} –{" "}
                    {fmtTime(r.shift?.drive_end)}
                  </div>
                </>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Tab: Ca chạy gần đây ───
// ─── Tab: Ca chạy ───
function AssignmentsTab({ employee }) {
  const { pastFrom, pastTo, futureTo } = useMemo(() => {
    const today = new Date();
    const past = new Date(today);
    past.setDate(past.getDate() - 30);
    const future = new Date(today);
    future.setDate(future.getDate() + 30);
    const p = (n) => String(n).padStart(2, "0");
    const fmt = (d) =>
      `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
    return {
      pastFrom: fmt(past),
      pastTo: fmt(today),
      futureTo: fmt(future),
    };
  }, []);

  const { data: pastData, isLoading: loadingPast } = useAssignmentsList({
    employee_id: employee.id,
    from: pastFrom,
    to: pastTo,
    limit: 20,
  });

  const { data: futureData, isLoading: loadingFuture } = useAssignmentsList({
    employee_id: employee.id,
    from: pastTo,
    to: futureTo,
    limit: 20,
  });

  const [subTab, setSubTab] = useState("upcoming");
  const isLoading = loadingPast || loadingFuture;

  const upcoming = futureData?.data || [];
  const past = pastData?.data || [];
  const list = subTab === "upcoming" ? upcoming : past;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 size={20} className="animate-spin text-[#169BA2]" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Sub-tabs */}
      <div className="inline-flex items-center bg-[#F8FAFC] rounded-lg border border-[#E5EAF0] p-0.5">
        <button
          type="button"
          onClick={() => setSubTab("upcoming")}
          className={`px-3 py-1.5 rounded-md text-xs font-semibold cursor-pointer transition-colors ${
            subTab === "upcoming"
              ? "bg-white text-[#169BA2] shadow-sm"
              : "text-[#6A7A9A] hover:text-[#4A5A7A]"
          }`}
        >
          Sắp tới ({upcoming.length})
        </button>
        <button
          type="button"
          onClick={() => setSubTab("past")}
          className={`px-3 py-1.5 rounded-md text-xs font-semibold cursor-pointer transition-colors ${
            subTab === "past"
              ? "bg-white text-[#169BA2] shadow-sm"
              : "text-[#6A7A9A] hover:text-[#4A5A7A]"
          }`}
        >
          30 ngày qua ({past.length})
        </button>
      </div>

      {/* List */}
      {list.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-12 h-12 rounded-full bg-[#F8FAFC] flex items-center justify-center mx-auto mb-3">
            <Briefcase size={20} className="text-[#B0BCCA]" />
          </div>
          <div className="text-sm font-medium text-[#4A5A7A] mb-1">
            {subTab === "upcoming"
              ? "Chưa có ca chạy sắp tới"
              : "Chưa có ca chạy 30 ngày qua"}
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {list.map((a) => {
            const statusStyles = {
              scheduled: {
                text: "Chờ chạy",
                cls: "text-[#4A5A7A] bg-[#F8FAFC]",
              },
              in_progress: {
                text: "Đang chạy",
                cls: "text-[#169BA2] bg-[#E6F4F5]",
              },
              completed: {
                text: "Hoàn thành",
                cls: "text-[#2E7D32] bg-[#F1F8F1]",
              },
              cancelled: {
                text: "Đã hủy",
                cls: "text-[#C62828] bg-[#FEF2F2]",
              },
            };
            const st = statusStyles[a.status] || statusStyles.scheduled;

            return (
              <div
                key={a.id}
                className="bg-white rounded-lg border border-[#E5EAF0] p-3"
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-xs font-bold text-[#1A2332] font-mono">
                    {fmtDate(a.date)} · {fmtTime(a.start_time)}–
                    {fmtTime(a.end_time)}
                  </span>
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${st.cls}`}
                  >
                    {st.text}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <div className="text-[9px] uppercase tracking-wider text-[#8A9AAA]">
                      Tuyến
                    </div>
                    <div className="text-[#1A2332] font-medium">
                      #{a.route_id}
                    </div>
                  </div>
                  <div>
                    <div className="text-[9px] uppercase tracking-wider text-[#8A9AAA]">
                      Xe
                    </div>
                    <div className="text-[#1A2332] font-mono">
                      {a.vehicle?.vehicle_code || UNKNOWN}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Tab: Nghỉ phép ───
function UnavailabilityTab({ employee }) {
  const { data, isLoading } = useUnavailabilityList({
    driver_id: employee.id,
    limit: 30,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 size={20} className="animate-spin text-[#169BA2]" />
      </div>
    );
  }

  const records = data?.data || [];

  if (records.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-12 h-12 rounded-full bg-[#F8FAFC] flex items-center justify-center mx-auto mb-3">
          <CheckCircle2 size={20} className="text-[#B0BCCA]" />
        </div>
        <div className="text-sm font-medium text-[#4A5A7A] mb-1">
          Chưa có ghi nhận nghỉ
        </div>
        <div className="text-xs text-[#8A9AAA]">
          Nhân viên chưa có lần nghỉ nào
        </div>
      </div>
    );
  }

  const typeLabels = {
    sick: "Nghỉ ốm",
    personal: "Việc riêng",
    vacation: "Nghỉ phép",
    training: "Đào tạo",
    suspended: "Đình chỉ",
  };

  const typeStyles = {
    sick: "text-[#C62828] bg-[#FEF2F2] border-[#FFC8C8]",
    personal: "text-[#E08940] bg-[#FEF3E2] border-[#FCD9A0]",
    vacation: "text-[#2E7D32] bg-[#F1F8F1] border-[#A8D5A8]",
    training: "text-[#169BA2] bg-[#E6F4F5] border-[#A8D5D8]",
    suspended: "text-[#6A7A9A] bg-[#F8FAFC] border-[#E5EAF0]",
  };

  return (
    <div className="space-y-2">
      {records.map((u) => {
        const style = typeStyles[u.type] || typeStyles.suspended;
        return (
          <div
            key={u.id}
            className="bg-white rounded-lg border border-[#E5EAF0] p-3"
          >
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <span
                className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${style}`}
              >
                {typeLabels[u.type] || u.type}
              </span>
              <span className="text-[10px] text-[#8A9AAA] font-mono">
                {fmtDate(u.date_from)} → {fmtDate(u.date_to)}
              </span>
            </div>
            {u.reason && (
              <div className="text-xs text-[#4A5A7A] leading-relaxed">
                {u.reason}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// MAIN DRAWER
// ═══════════════════════════════════════════════════════════════
export function EmployeeDetailDrawer({ employee, open, onClose }) {
  const [tab, setTab] = useState("overview");

  useEffect(() => {
    if (open) setTab("overview");
  }, [open, employee?.id]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || !employee) return null;

  const typeStyle =
    EMPLOYEE_TYPE_STYLES[employee.type] || EMPLOYEE_TYPE_STYLES.driver;
  const isDriverOrCoDriver =
    employee.type === "driver" || employee.type === "co_driver";

  const TABS = [
    { id: "overview", label: "Tổng quan", icon: Info },
    ...(isDriverOrCoDriver
      ? [
          { id: "schedule", label: "Lịch tuần này", icon: CalendarDays },
          { id: "assignments", label: "Ca chạy", icon: Briefcase },
        ]
      : []),
    ...(employee.type === "driver"
      ? [{ id: "unavailability", label: "Nghỉ phép", icon: AlertTriangle }]
      : []),
  ];

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
        {/* Header */}
        <header className="flex-shrink-0 border-b border-[#E5EAF0] bg-white">
          <div className="flex items-start gap-3 px-5 py-4">
            <EmployeeAvatar employee={employee} size="lg" />
            <div className="flex-1 min-w-0 pt-1">
              <div className="text-base font-bold text-[#1A2332] leading-tight mb-1">
                {employee.full_name}
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] text-[#8A9AAA] font-mono">
                  {employee.employee_code}
                </span>
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${typeStyle.bg} ${typeStyle.text} ${typeStyle.border}`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${typeStyle.dot}`}
                  />
                  {EMPLOYEE_TYPE_LABELS[employee.type] || employee.type}
                </span>
                {employee.is_active !== false ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#2E7D32]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#2E7D32]" />
                    Hoạt động
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#8A9AAA]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#8A9AAA]" />
                    Ngưng
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

          {/* Tabs */}
          <div className="flex border-t border-[#E5EAF0] overflow-x-auto scrollbar-thin">
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`flex-1 min-w-fit inline-flex items-center justify-center gap-1.5 py-3 px-4 text-xs font-semibold border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
                  tab === t.id
                    ? "text-[#169BA2] border-[#169BA2] bg-[#F0F9FA]"
                    : "text-[#6A7A9A] border-transparent hover:text-[#1A2332] hover:bg-[#F8FAFC]"
                }`}
              >
                <t.icon size={13} />
                {t.label}
              </button>
            ))}
          </div>
        </header>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 scrollbar-thin">
          {tab === "overview" && <OverviewTab employee={employee} />}
          {tab === "schedule" && <ScheduleTab employee={employee} />}
          {tab === "assignments" && <AssignmentsTab employee={employee} />}
          {tab === "unavailability" && (
            <UnavailabilityTab employee={employee} />
          )}
        </div>
      </div>
    </>
  );
}

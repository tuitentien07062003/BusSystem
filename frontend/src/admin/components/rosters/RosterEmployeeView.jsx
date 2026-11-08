import { useState, useMemo, useEffect } from "react";
import {
  Search,
  X,
  Loader2,
  User as UserIcon,
  CalendarDays,
  TrendingUp,
  Clock,
  ArrowRight,
} from "lucide-react";
import { EmployeeAvatar } from "../employees/EmployeeAvatar";
import {
  WEEKDAY_SHORT,
  getShiftStyle,
  buildDatesArray,
  fmtMonthLabel,
} from "./rosterConstants";
import { useEmployeesList } from "@/hooks/useEmployees";
import { useRostersByEmployee } from "@/hooks/useRosters";
import { useActiveShiftTemplates } from "@/hooks/useShiftTemplates";
import { useUpdateRoster } from "@/hooks/useRosters";

// ─── Empty state ───
function EmptyState() {
  return (
    <div className="bg-white rounded-xl border border-dashed border-[#D0D7E2] py-20 px-6 flex flex-col items-center text-center">
      <div className="w-16 h-16 rounded-full bg-[#F8FAFC] flex items-center justify-center mb-4">
        <UserIcon size={26} className="text-[#B0BCCA]" />
      </div>
      <h3 className="text-sm font-bold text-[#1A2332] mb-1">
        Chưa chọn nhân viên
      </h3>
      <p className="text-xs text-[#8A9AAA] max-w-sm">
        Tìm và chọn 1 nhân viên để xem lịch phân ca cá nhân và thay đổi ca.
      </p>
    </div>
  );
}

// ─── Search input ───
function EmployeeSearch({ onPick, onClear, selectedEmployee }) {
  const [input, setInput] = useState("");
  const [debounced, setDebounced] = useState("");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(input), 300);
    return () => clearTimeout(t);
  }, [input]);

  const { data, isFetching } = useEmployeesList({
    page: 1,
    limit: 20,
    q: debounced,
    type: "driver",
  });
  const results = data?.data || [];

  if (selectedEmployee) {
    return (
      <div className="flex items-center gap-2 bg-white rounded-xl border border-[#E5EAF0] p-3">
        <div className="flex-1 flex items-center gap-3 min-w-0">
          <EmployeeAvatar employee={selectedEmployee} size="sm" />
          <div className="min-w-0">
            <div className="text-sm font-bold text-[#1A2332] truncate">
              {selectedEmployee.full_name}
            </div>
            <div className="text-[11px] text-[#8A9AAA] font-mono">
              {selectedEmployee.employee_code}
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={onClear}
          className="h-9 px-3 rounded-md border border-[#D0D7E2] bg-white hover:bg-[#F8FAFC] text-xs font-semibold text-[#4A5A7A] cursor-pointer inline-flex items-center gap-1.5"
        >
          <X size={12} />
          Đổi người
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="relative">
        <Search
          size={14}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8A9AAA] pointer-events-none"
        />
        <input
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Tìm nhân viên theo tên hoặc mã..."
          className="w-full h-11 pl-10 pr-10 rounded-xl border border-[#E5EAF0] bg-white text-sm text-[#1A2332] placeholder:text-[#B0BCCA] outline-none focus:border-[#169BA2] focus:ring-2 focus:ring-[#169BA2]/20 transition-all"
        />
        {isFetching && (
          <Loader2
            size={14}
            className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-[#169BA2]"
          />
        )}
      </div>

      {open && (
        <>
          <div
            className="fixed inset-0 z-[100]"
            onClick={() => setOpen(false)}
          />
          <div className="absolute top-full left-0 right-0 mt-1.5 bg-white rounded-xl border border-[#E5EAF0] shadow-xl z-[110] overflow-hidden max-h-[360px] overflow-y-auto scrollbar-thin">
            {results.length === 0 ? (
              <div className="px-4 py-8 text-center text-xs text-[#8A9AAA]">
                {isFetching
                  ? "Đang tìm..."
                  : input
                    ? "Không tìm thấy nhân viên nào"
                    : "Nhập để tìm nhân viên"}
              </div>
            ) : (
              results.map((emp) => (
                <button
                  key={emp.id}
                  type="button"
                  onClick={() => {
                    onPick(emp);
                    setOpen(false);
                    setInput("");
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-[#F8FAFC] transition-colors cursor-pointer text-left border-b border-[#F0F3F7] last:border-0"
                >
                  <EmployeeAvatar employee={emp} size="sm" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-[#1A2332] truncate">
                      {emp.full_name}
                    </div>
                    <div className="text-[10px] text-[#8A9AAA] font-mono">
                      {emp.employee_code}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Profile card ───
function ProfileCard({ employee, stats }) {
  return (
    <div className="bg-white rounded-xl border border-[#E5EAF0] p-5">
      <div className="flex items-center gap-4">
        <EmployeeAvatar employee={employee} size="lg" />
        <div className="flex-1 min-w-0">
          <div className="text-base font-bold text-[#1A2332] truncate">
            {employee.full_name}
          </div>
          <div className="text-xs text-[#8A9AAA] font-mono mt-0.5">
            {employee.employee_code}
          </div>
          <div className="flex items-center gap-2 mt-2">
            {employee.license_class && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-[#E6F4F5] text-[#0F7075] text-[10px] font-bold">
                Bằng {employee.license_class}
              </span>
            )}
            {employee.is_active ? (
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
      </div>

      {stats && (
        <div className="grid grid-cols-3 gap-3 mt-5 pt-5 border-t border-[#F0F3F7]">
          <div className="text-center">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-[#8A9AAA] mb-1">
              Ngày làm
            </div>
            <div className="text-xl font-bold text-[#1A2332]">
              {stats.workingDays}
            </div>
          </div>
          <div className="text-center border-x border-[#F0F3F7]">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-[#8A9AAA] mb-1">
              Ngày nghỉ
            </div>
            <div className="text-xl font-bold text-[#8A9AAA]">
              {stats.offDays}
            </div>
          </div>
          <div className="text-center">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-[#8A9AAA] mb-1">
              Tổng giờ
            </div>
            <div className="text-xl font-bold text-[#169BA2]">
              {stats.totalHours}h
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Calendar 1 hàng ───
function PersonalCalendar({ dates, rosterByDate, employee, onCellClick }) {
  const gridCols = `repeat(${dates.length}, 52px)`;

  return (
    <div className="bg-white rounded-xl border border-[#E5EAF0] overflow-hidden">
      <div className="px-4 py-3 border-b border-[#E5EAF0] bg-[#F8FAFC] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarDays size={14} className="text-[#169BA2]" />
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#4A5A7A]">
            Lịch phân ca cá nhân
          </span>
        </div>
        <div className="text-[11px] text-[#8A9AAA]">Click ô để đổi ca</div>
      </div>

      <div className="overflow-x-auto scrollbar-thin">
        <div className="p-4 min-w-fit">
          <div
            className="grid gap-1.5"
            style={{ gridTemplateColumns: gridCols }}
          >
            {/* Header */}
            {dates.map((d) => (
              <div key={d.date} className="text-center select-none">
                <div className="text-sm font-bold text-[#1A2332] leading-none">
                  {d.day}
                </div>
                <div className="text-[10px] text-[#8A9AAA] mt-1 leading-none">
                  {WEEKDAY_SHORT[d.weekday]}
                </div>
              </div>
            ))}

            {/* Row */}
            {dates.map((d) => {
              const r = rosterByDate.get(d.date);
              if (!r) {
                return (
                  <button
                    key={d.date}
                    type="button"
                    className="w-12 h-12 rounded-lg bg-[#F8FAFC] border border-[#F0F3F7] hover:border-[#A8D5D8] transition-colors cursor-pointer"
                  />
                );
              }
              const style = getShiftStyle(r.shift?.code, r.status);
              return (
                <button
                  key={d.date}
                  type="button"
                  title={style.label}
                  onClick={() => onCellClick(r, d.date)}
                  className={`w-12 h-12 rounded-lg ${style.bg} ${style.text} text-sm font-bold hover:scale-105 transition-transform cursor-pointer shadow-sm`}
                >
                  {style.short}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// MAIN VIEW
// ═══════════════════════════════════════════════════════════════
export function RosterEmployeeView({
  month,
  onDayEdit,
  onChangeShift,
  updatingRosterId,
}) {
  const [selectedEmp, setSelectedEmp] = useState(null);

  // Range ngày trong tháng
  const dates = useMemo(() => buildDatesArray(month), [month]);
  const fromDate = dates[0]?.date;
  const toDate = dates[dates.length - 1]?.date;

  const { data, isLoading } = useRostersByEmployee(selectedEmp?.id, {
    from: fromDate,
    to: toDate,
    enabled: !!selectedEmp,
  });

  const rosters = data?.data || [];

  const rosterByDate = useMemo(() => {
    const m = new Map();
    rosters.forEach((r) => m.set(r.date, r));
    return m;
  }, [rosters]);

  // Stats
  const stats = useMemo(() => {
    let workingDays = 0;
    let offDays = 0;
    let totalHours = 0;
    rosters.forEach((r) => {
      if (r.status === "off" || r.status === "absent") {
        offDays++;
      } else {
        workingDays++;
        if (r.shift) {
          const start = r.shift.drive_start;
          const end = r.shift.drive_end;
          const toSec = (t) => {
            const [h, m] = String(t).split(":").map(Number);
            return h * 3600 + m * 60;
          };
          totalHours += (toSec(end) - toSec(start)) / 3600;
        }
      }
    });
    return {
      workingDays,
      offDays,
      totalHours: Math.round(totalHours),
    };
  }, [rosters]);

  return (
    <div className="space-y-3">
      <EmployeeSearch
        onPick={setSelectedEmp}
        onClear={() => setSelectedEmp(null)}
        selectedEmployee={selectedEmp}
      />

      {!selectedEmp ? (
        <EmptyState />
      ) : isLoading ? (
        <div className="bg-white rounded-xl border border-[#E5EAF0] py-16 flex flex-col items-center justify-center">
          <Loader2 size={24} className="animate-spin text-[#169BA2] mb-3" />
          <p className="text-xs text-[#8A9AAA]">Đang tải lịch...</p>
        </div>
      ) : (
        <>
          <ProfileCard employee={selectedEmp} stats={stats} />
          <PersonalCalendar
            dates={dates}
            rosterByDate={rosterByDate}
            employee={selectedEmp}
            onCellClick={(roster, date) =>
              onDayEdit?.([roster], date, "personal")
            }
          />
        </>
      )}
    </div>
  );
}

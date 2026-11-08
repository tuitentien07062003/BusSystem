import { Loader2 } from "lucide-react";
import { WEEKDAY_SHORT, getShiftStyle } from "./rosterConstants";

// ─── Cell ───
function RosterCell({ cell, onClick }) {
  const style = cell ? getShiftStyle(cell.shift_code, cell.status) : null;

  if (!style) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="w-12 h-12 rounded-lg bg-[#F8FAFC] border border-[#F0F3F7] hover:border-[#A8D5D8] transition-colors cursor-pointer"
      />
    );
  }

  const tooltip = cell
    ? `${style.label}${cell.employee_count ? ` · ${cell.employee_count} người` : ""}`
    : "";

  return (
    <button
      type="button"
      onClick={onClick}
      title={tooltip}
      className={`w-12 h-12 rounded-lg ${style.bg} ${style.text} text-sm font-bold hover:scale-105 transition-transform cursor-pointer shadow-sm`}
    >
      {style.short}
    </button>
  );
}

// ─── Grid ───
export function RosterGrid({
  dates,
  subGroups,
  cellsBySubGroup,
  onCellClick,
  isLoading,
}) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-[#E5EAF0] py-16 flex flex-col items-center justify-center">
        <Loader2 size={24} className="animate-spin text-[#169BA2] mb-3" />
        <p className="text-xs text-[#8A9AAA]">Đang tải lịch phân ca...</p>
      </div>
    );
  }

  const gridCols = `140px repeat(${dates.length}, 52px)`;

  return (
    <div className="bg-white rounded-xl border border-[#E5EAF0] overflow-hidden">
      <div className="overflow-x-auto scrollbar-thin">
        <div className="p-5 min-w-fit">
          <div
            className="grid gap-1.5"
            style={{ gridTemplateColumns: gridCols }}
          >
            {/* Corner */}
            <div />

            {/* Header: day + weekday */}
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

            {/* 8 sub-group rows */}
            {subGroups.map((sg) => {
              const cells = cellsBySubGroup[sg.key] || {};
              const isRole2 = sg.role === 2;

              return (
                <div key={sg.key} className="contents">
                  <div
                    className={`flex flex-col justify-center pr-3 select-none ${
                      isRole2
                        ? "border-t border-dashed border-[#E5EAF0] pt-1"
                        : ""
                    }`}
                  >
                    <div className="text-sm font-bold text-[#1A2332]">
                      {sg.name}
                      <span className="text-[#8A9AAA] font-normal"> · </span>
                      <span className="text-[#4A5A7A]">{sg.roleLabel}</span>
                    </div>
                    <div className="text-xs text-[#8A9AAA] mt-1">
                      {sg.employees.length} người
                    </div>
                  </div>
                  {dates.map((d) => (
                    <RosterCell
                      key={`${sg.key}-${d.date}`}
                      cell={cells[d.date]}
                      onClick={() => onCellClick?.(sg, d.date)}
                    />
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

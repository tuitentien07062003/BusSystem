import { useState } from "react";
import {
  getRouteColor,
  getStatusStyle,
  timeToPixel,
  timeToHourFloat,
  fmtTime,
} from "./assignmentConstants";

export function AssignmentBlock({
  assignment,
  pixelsPerHour,
  isPast,
  isRunning,
  onClick,
  onEdit,
  onDelete,
}) {
  const [hovered, setHovered] = useState(false);

  const routeColor = getRouteColor(assignment.route_id);
  const statusStyle = getStatusStyle(assignment.status);

  const startPx = timeToPixel(assignment.start_time, { pixelsPerHour });
  const endPx = timeToPixel(assignment.end_time, { pixelsPerHour });
  const widthPx = Math.max(40, endPx - startPx);

  const shiftLabel = assignment.shift?.code === "MORNING" ? "Sáng" : "Tối";
  const driverCode = assignment.driver?.employee_code || "—";
  const driverName = assignment.driver?.full_name || "";
  const routeShort = assignment.route_id;
  const vehicleCode = assignment.vehicle?.vehicle_code || "";

  const isNarrow = widthPx < 130;
  const isVeryNarrow = widthPx < 80;

  const labelMain = isVeryNarrow
    ? `${routeShort}`
    : `${shiftLabel} · ${routeShort} · ${driverCode}`;

  return (
    <div
      className="absolute top-1.5 bottom-1.5 transition-all cursor-pointer"
      style={{
        left: `${startPx}px`,
        width: `${widthPx}px`,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => onClick?.(assignment)}
    >
      <div
        className={`h-full rounded-lg ${routeColor.bg} ${routeColor.text} px-2.5 flex items-center overflow-hidden transition-all ${
          isPast && !isRunning ? "opacity-50" : ""
        } ${hovered ? "shadow-lg scale-[1.02]" : "shadow-sm"} ${
          isRunning ? "ring-2 ring-[#E08940] ring-offset-1" : ""
        }`}
      >
        {isRunning && (
          <span className="relative flex h-2 w-2 mr-2 flex-shrink-0">
            <span className="absolute inline-flex h-full w-full rounded-full bg-white opacity-75 animate-ping" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
          </span>
        )}
        <span className="text-xs font-bold truncate flex-1">{labelMain}</span>
        <span
          className={`w-1.5 h-1.5 rounded-full ${statusStyle.dot} flex-shrink-0 ml-2`}
        />
      </div>

      {hovered && (
        <div
          className="absolute left-0 top-full mt-1.5 z-[100] w-[280px] bg-white rounded-xl border border-[#E5EAF0] shadow-xl p-3 pointer-events-none"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-start justify-between gap-2 mb-2.5">
            <div className="flex items-center gap-2 min-w-0">
              <span
                className={`w-2 h-2 rounded-full flex-shrink-0 ${statusStyle.dot} ${
                  isRunning ? "animate-pulse" : ""
                }`}
              />
              <span className="text-[11px] font-bold text-[#1A2332]">
                {vehicleCode}
              </span>
              <span className="text-[11px] text-[#8A9AAA] font-mono">
                {assignment.vehicle?.license_plate}
              </span>
            </div>
            <span
              className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${statusStyle.bg} ${statusStyle.text} border ${statusStyle.border}`}
            >
              {statusStyle.label}
            </span>
          </div>

          <div className={`h-1 rounded-full mb-2.5 ${routeColor.bg}`} />

          <div className="space-y-1.5 text-[11px]">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[#8A9AAA]">Tuyến</span>
              <span className="font-semibold text-[#1A2332] truncate">
                {routeShort}
              </span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-[#8A9AAA]">Tài xế</span>
              <span className="font-semibold text-[#1A2332] truncate max-w-[140px]">
                {driverName}
              </span>
            </div>
            {assignment.co_driver && (
              <div className="flex items-center justify-between gap-2">
                <span className="text-[#8A9AAA]">Lơ xe</span>
                <span className="text-[#4A5A7A] truncate max-w-[140px]">
                  {assignment.co_driver.full_name}
                </span>
              </div>
            )}
            <div className="flex items-center justify-between gap-2 pt-1.5 border-t border-[#F0F3F7]">
              <span className="text-[#8A9AAA]">Thời gian</span>
              <span className="font-mono font-semibold text-[#1A2332]">
                {fmtTime(assignment.start_time)} –{" "}
                {fmtTime(assignment.end_time)}
              </span>
            </div>
          </div>

          <div className="mt-2.5 pt-2 border-t border-[#F0F3F7] text-[10px] text-[#8A9AAA] text-center">
            Click để xem chi tiết
          </div>
        </div>
      )}
    </div>
  );
}

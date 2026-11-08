import { useRef, useEffect, useMemo } from "react";
import { Loader2, Plus, Bus } from "lucide-react";
import { AssignmentBlock } from "./AssignmentBlock";
import {
  TIMELINE_START_HOUR,
  TIMELINE_END_HOUR,
  TIMELINE_HOURS,
  PIXELS_PER_HOUR,
  timeToPixel,
  todayStr,
} from "./assignmentConstants";
import {
  groupAssignmentsByVehicle,
  buildTimelineTicks,
  isAssignmentRunning,
  isAssignmentPast,
} from "./assignmentHelpers";

function EmptySlotRow({ vehicleCode, onAdd }) {
  return (
    <div className="flex items-center gap-2 h-full">
      <div
        className="h-9 rounded-lg border-2 border-dashed border-[#D0D7E2] bg-[#F8FAFC] flex items-center justify-center cursor-pointer hover:border-[#169BA2] hover:bg-[#E6F4F5] transition-colors group"
        style={{ width: `${TIMELINE_HOURS * PIXELS_PER_HOUR}px` }}
        onClick={onAdd}
      >
        <div className="flex items-center gap-2 text-[#8A9AAA] group-hover:text-[#169BA2]">
          <Plus size={14} />
          <span className="text-xs font-semibold">Chưa phân công</span>
        </div>
      </div>
    </div>
  );
}

function LiveCursor({ date, pixelsPerHour }) {
  const now = new Date();

  const isToday = date === todayStr();
  if (!isToday) return null;

  const currentHour = now.getHours() + now.getMinutes() / 60;
  if (currentHour < TIMELINE_START_HOUR || currentHour > TIMELINE_END_HOUR) {
    return null;
  }

  const leftPx = timeToPixel(
    `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`,
    { pixelsPerHour },
  );

  return (
    <>
      <div
        className="absolute top-0 bottom-0 w-px bg-[#C62828] z-20 pointer-events-none"
        style={{ left: `${leftPx}px` }}
      >
        <div className="absolute -top-1 -left-[3px] w-2 h-2 rounded-full bg-[#C62828] shadow-md" />
      </div>
    </>
  );
}

function TimelineHeader({ pixelsPerHour }) {
  const ticks = useMemo(() => buildTimelineTicks(), []);

  return (
    <div
      className="relative h-10 border-b border-[#E5EAF0] bg-[#F8FAFC]"
      style={{ width: `${TIMELINE_HOURS * pixelsPerHour}px` }}
    >
      {ticks.map((t) => {
        const leftPx = timeToPixel(`${String(t.hour).padStart(2, "0")}:00`, {
          pixelsPerHour,
        });
        return (
          <div
            key={t.hour}
            className="absolute top-0 bottom-0 flex flex-col items-center justify-end"
            style={{ left: `${leftPx}px` }}
          >
            <div
              className={`w-px ${t.isMajor ? "bg-[#B0BCCA]" : "bg-[#E5EAF0]"}`}
              style={{ height: t.isMajor ? 14 : 8 }}
            />
            {t.isMajor && (
              <span className="text-[10px] font-mono font-semibold text-[#6A7A9A] mt-1">
                {t.label}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

function GridBackground({ pixelsPerHour, height }) {
  const ticks = useMemo(() => buildTimelineTicks(), []);

  return (
    <div className="absolute inset-0 pointer-events-none">
      {ticks.map((t) => {
        const leftPx = timeToPixel(`${String(t.hour).padStart(2, "0")}:00`, {
          pixelsPerHour,
        });
        return (
          <div
            key={t.hour}
            className={`absolute top-0 bottom-0 w-px ${
              t.isMajor ? "bg-[#E5EAF0]" : "bg-[#F0F3F7]"
            }`}
            style={{ left: `${leftPx}px`, height }}
          />
        );
      })}
    </div>
  );
}

export function AssignmentTimelineView({
  assignments = [],
  vehicles = [],
  date,
  routeId,
  isLoading,
  onSelect,
  onAddForVehicle,
}) {
  const scrollRef = useRef(null);
  const pixelsPerHour = PIXELS_PER_HOUR;

  useEffect(() => {
    if (!scrollRef.current) return;
    const now = new Date();
    const currentHour = now.getHours();
    if (
      currentHour >= TIMELINE_START_HOUR &&
      currentHour <= TIMELINE_END_HOUR
    ) {
      const leftPx = timeToPixel(`${String(currentHour).padStart(2, "0")}:00`, {
        pixelsPerHour,
      });
      scrollRef.current.scrollLeft = Math.max(0, leftPx - 200);
    } else {
      scrollRef.current.scrollLeft =
        timeToPixel("07:00", { pixelsPerHour }) - 100;
    }
  }, [pixelsPerHour]);

  const filteredAssignments = useMemo(() => {
    if (!routeId || routeId === "all") return assignments;
    return assignments.filter((a) => String(a.route_id) === String(routeId));
  }, [assignments, routeId]);

  const vehicleGroups = useMemo(
    () => groupAssignmentsByVehicle(filteredAssignments),
    [filteredAssignments],
  );

  const displayRows = useMemo(() => {
    const rows = [...vehicleGroups];
    const usedVehicleIds = new Set(rows.map((r) => r.vehicle_id));

    if (vehicles && vehicles.length > 0) {
      vehicles.forEach((v) => {
        if (!usedVehicleIds.has(v.id)) {
          rows.push({
            vehicle_id: v.id,
            vehicle: v,
            assignments: [],
          });
        }
      });
    }

    return rows.sort((a, b) =>
      String(a.vehicle?.vehicle_code || "").localeCompare(
        String(b.vehicle?.vehicle_code || ""),
      ),
    );
  }, [vehicleGroups, vehicles]);

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-[#E5EAF0] py-20 flex flex-col items-center justify-center">
        <Loader2 size={24} className="animate-spin text-[#169BA2] mb-3" />
        <p className="text-xs text-[#8A9AAA]">Đang tải timeline...</p>
      </div>
    );
  }

  if (displayRows.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-dashed border-[#D0D7E2] py-20 px-6 flex flex-col items-center text-center">
        <div className="w-16 h-16 rounded-full bg-[#F8FAFC] flex items-center justify-center mb-4">
          <Bus size={26} className="text-[#B0BCCA]" />
        </div>
        <h3 className="text-sm font-bold text-[#1A2332] mb-1">
          Chưa có phân công nào
        </h3>
        <p className="text-xs text-[#8A9AAA] max-w-sm">
          Bấm "Tạo phân công" để phân công xe và tài xế cho các chuyến trong
          ngày này.
        </p>
      </div>
    );
  }

  const rowsHeight = displayRows.length * 56 + 16;
  const timelineWidth = TIMELINE_HOURS * pixelsPerHour;

  return (
    <div className="bg-white rounded-xl border border-[#E5EAF0] overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#E5EAF0] bg-white">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-[#169BA2]" />
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#4A5A7A]">
            Timeline · {displayRows.length} xe
          </span>
        </div>
        <div className="flex items-center gap-3 text-[10px] text-[#8A9AAA]">
          <span className="inline-flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm bg-[#169BA2]" />
            Tuyến 19
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm bg-[#E08940]" />
            Tuyến 56
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm bg-[#9333EA]" />
            Tuyến D4
          </span>
        </div>
      </div>

      <div className="flex overflow-hidden">
        <div
          className="flex-shrink-0 bg-[#F8FAFC] border-r border-[#E5EAF0] z-10"
          style={{ width: 180 }}
        >
          <div className="h-10 border-b border-[#E5EAF0] flex items-center px-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8A9AAA]">
              Xe
            </span>
          </div>

          {displayRows.map((row) => {
            const v = row.vehicle;
            return (
              <div
                key={row.vehicle_id}
                className="h-14 flex items-center gap-2 px-3 border-b border-[#F0F3F7] bg-white"
              >
                <div className="w-8 h-8 rounded-lg bg-[#E6F4F5] flex items-center justify-center flex-shrink-0">
                  <Bus size={14} className="text-[#169BA2]" />
                </div>
                <div className="min-w-0">
                  <div className="text-[11px] font-bold text-[#1A2332] font-mono truncate">
                    {v?.vehicle_code || `#${row.vehicle_id}`}
                  </div>
                  <div className="text-[10px] text-[#8A9AAA] font-mono truncate">
                    {v?.license_plate || "—"}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div ref={scrollRef} className="flex-1 overflow-x-auto scrollbar-thin">
          <div
            className="relative"
            style={{ width: timelineWidth, minHeight: rowsHeight }}
          >
            <TimelineHeader pixelsPerHour={pixelsPerHour} />

            <div className="relative">
              <GridBackground
                pixelsPerHour={pixelsPerHour}
                height={displayRows.length * 56 + 16}
              />

              <LiveCursor date={date} pixelsPerHour={pixelsPerHour} />

              <div className="relative">
                {displayRows.map((row) => (
                  <div
                    key={row.vehicle_id}
                    className="h-14 relative border-b border-[#F0F3F7]"
                  >
                    {row.assignments.length === 0 ? (
                      <div className="absolute inset-2 top-2 bottom-2">
                        <EmptySlotRow
                          vehicleCode={row.vehicle?.vehicle_code}
                          onAdd={() => onAddForVehicle?.(row.vehicle)}
                        />
                      </div>
                    ) : (
                      row.assignments.map((a) => (
                        <AssignmentBlock
                          key={a.id}
                          assignment={a}
                          pixelsPerHour={pixelsPerHour}
                          isPast={isAssignmentPast(a)}
                          isRunning={isAssignmentRunning(a)}
                          onClick={onSelect}
                        />
                      ))
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

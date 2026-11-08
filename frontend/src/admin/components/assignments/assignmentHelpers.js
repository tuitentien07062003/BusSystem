import {
  TIMELINE_START_HOUR,
  TIMELINE_END_HOUR,
  timeToHourFloat,
} from "./assignmentConstants";

export function groupAssignmentsByVehicle(assignments) {
  const map = new Map();
  assignments.forEach((a) => {
    const vid = a.vehicle_id;
    if (!vid) return;
    if (!map.has(vid)) {
      map.set(vid, {
        vehicle_id: vid,
        vehicle: a.vehicle,
        assignments: [],
      });
    }
    map.get(vid).assignments.push(a);
  });

  const list = [...map.values()];
  list.forEach((g) => {
    g.assignments.sort((a, b) =>
      String(a.start_time).localeCompare(String(b.start_time)),
    );
  });

  list.sort((a, b) =>
    String(a.vehicle?.vehicle_code || "").localeCompare(
      String(b.vehicle?.vehicle_code || ""),
    ),
  );

  return list;
}

export function computeWarnings(assignments) {
  const warnings = [];

  assignments.forEach((a) => {
    const start = timeToHourFloat(a.start_time);
    const end = timeToHourFloat(a.end_time);
    if (start < TIMELINE_START_HOUR || end > TIMELINE_END_HOUR) {
      warnings.push({
        type: "out_of_range",
        assignment_id: a.id,
        message: `Block ${a.vehicle?.vehicle_code} chạy ngoài khung timeline (${a.start_time}–${a.end_time})`,
      });
    }
  });

  return warnings;
}

export function isAssignmentRunning(a, now = new Date()) {
  if (a.status === "in_progress") return true;
  if (a.status !== "scheduled") return false;

  const nowHour = now.getHours() + now.getMinutes() / 60;
  const start = timeToHourFloat(a.start_time);
  const end = timeToHourFloat(a.end_time);
  return nowHour >= start && nowHour <= end;
}

export function isAssignmentPast(a, now = new Date()) {
  if (a.status === "completed") return true;
  if (a.status === "cancelled") return true;
  const nowHour = now.getHours() + now.getMinutes() / 60;
  const end = timeToHourFloat(a.end_time);
  return nowHour > end;
}

export function buildTimelineTicks() {
  const ticks = [];
  for (let h = TIMELINE_START_HOUR; h <= TIMELINE_END_HOUR; h++) {
    const p = (n) => String(n).padStart(2, "0");
    ticks.push({
      hour: h,
      label: `${p(h)}:00`,
      isMajor: h % 2 === 0,
    });
  }
  return ticks;
}

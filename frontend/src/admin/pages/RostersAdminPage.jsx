import { useState, useMemo } from "react";
import { LayoutGrid, User as UserIcon } from "lucide-react";
import { PageHeader } from "../components/PageHeader";
import { RosterFilterBar } from "../components/rosters/RosterFilterBar";
import { RosterGrid } from "../components/rosters/RosterGrid";
import { RosterDayDialog } from "../components/rosters/RosterDayDialog";
import { RosterEmployeeView } from "../components/rosters/RosterEmployeeView";
import { buildDatesArray } from "../components/rosters/rosterConstants";
import { useRostersMonth } from "@/hooks/useRosters";
import { useStopsList } from "@/hooks/useStops";

function currentMonth() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}`;
}

function splitIntoSubGroups(rosters) {
  const empMap = new Map();
  rosters.forEach((r) => {
    if (r.employee && !empMap.has(r.employee_id)) {
      empMap.set(r.employee_id, r.employee);
    }
  });
  const employees = [...empMap.values()].sort((a, b) =>
    String(a.employee_code).localeCompare(String(b.employee_code)),
  );

  const perGroup = Math.floor(employees.length / 4);
  const remainder = employees.length % 4;
  const mainGroups = { A: [], B: [], C: [], D: [] };
  const names = ["A", "B", "C", "D"];
  let idx = 0;
  names.forEach((name, i) => {
    const size = perGroup + (i < remainder ? 1 : 0);
    mainGroups[name] = employees.slice(idx, idx + size);
    idx += size;
  });

  const ceilSides = { A: "ceil", B: "floor", C: "ceil", D: "floor" };
  const subGroups = [];
  names.forEach((name) => {
    const emps = mainGroups[name];
    const ceilSize = Math.ceil(emps.length / 2);
    const r1Size =
      ceilSides[name] === "ceil" ? ceilSize : emps.length - ceilSize;

    subGroups.push({
      key: `${name}_1`,
      name,
      role: 1,
      roleLabel: `Nửa 1`,
      employees: emps.slice(0, r1Size),
    });
    subGroups.push({
      key: `${name}_2`,
      name,
      role: 2,
      roleLabel: `Nửa 2`,
      employees: emps.slice(r1Size),
    });
  });

  return subGroups;
}

function buildCellsForSubGroup(subGroup, rosters) {
  const empIds = new Set(subGroup.employees.map((e) => e.id));
  const cells = {};
  rosters.forEach((r) => {
    if (!empIds.has(r.employee_id)) return;
    if (!cells[r.date]) {
      cells[r.date] = {
        shift_code: r.shift?.code || null,
        status: r.status,
        roster_id: r.id,
        roster_ids: [],
        employee_count: 0,
      };
    }
    cells[r.date].roster_ids.push(r.id);
    cells[r.date].employee_count++;
  });
  return cells;
}

export function RostersAdminPage() {
  const [view, setView] = useState("group"); // "group" | "personal"
  const [month, setMonth] = useState(currentMonth());
  const [depotId, setDepotId] = useState("all");
  const [dayDialog, setDayDialog] = useState(null);

  const { data: depotsData } = useStopsList({
    page: 1,
    limit: 500,
    stop_type: 1,
  });
  const depots = depotsData?.data || [];

  const { data, isLoading, isFetching, refetch } = useRostersMonth({
    month,
    depot_id: depotId === "all" ? undefined : depotId,
  });

  const dates = useMemo(() => buildDatesArray(month), [month]);

  const { subGroups, cellsBySubGroup } = useMemo(() => {
    const rosters = data?.data || [];
    const subGroups = splitIntoSubGroups(rosters);
    const cellsBySubGroup = {};
    subGroups.forEach((sg) => {
      cellsBySubGroup[sg.key] = buildCellsForSubGroup(sg, rosters);
    });
    return { subGroups, cellsBySubGroup };
  }, [data]);

  const totalEmployees = useMemo(
    () => subGroups.reduce((sum, sg) => sum + sg.employees.length, 0),
    [subGroups],
  );
  const totalRosters = data?.data?.length || 0;

  return (
    <div className="h-full overflow-y-auto bg-[#EEF2F6]">
      <div className="max-w-[1600px] mx-auto px-6 py-6 space-y-4">
        <PageHeader
          title="Quản lý phân ca"
          description={`${totalEmployees} nhân viên · ${totalRosters.toLocaleString("vi-VN")} ca trong tháng ${month.split("-")[1]}/${month.split("-")[0]}`}
        />

        {/* View toggle */}
        <div className="flex items-center justify-between gap-3">
          <div className="inline-flex items-center bg-white rounded-lg border border-[#E5EAF0] p-1">
            <button
              type="button"
              onClick={() => setView("group")}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                view === "group"
                  ? "bg-[#169BA2] text-white shadow-sm"
                  : "text-[#6A7A9A] hover:bg-[#F8FAFC]"
              }`}
            >
              <LayoutGrid size={13} />
              Theo nhóm
            </button>
            <button
              type="button"
              onClick={() => setView("personal")}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                view === "personal"
                  ? "bg-[#169BA2] text-white shadow-sm"
                  : "text-[#6A7A9A] hover:bg-[#F8FAFC]"
              }`}
            >
              <UserIcon size={13} />
              Theo cá nhân
            </button>
          </div>
        </div>

        <RosterFilterBar
          month={month}
          depotId={depotId}
          onMonthChange={setMonth}
          onDepotChange={setDepotId}
          onRefresh={refetch}
          isFetching={isFetching}
          depots={depots}
        />

        {view === "group" ? (
          <RosterGrid
            dates={dates}
            subGroups={subGroups}
            cellsBySubGroup={cellsBySubGroup}
            isLoading={isLoading}
            onCellClick={(subGroup, date) => setDayDialog({ subGroup, date })}
          />
        ) : (
          <RosterEmployeeView month={month} />
        )}
      </div>

      <RosterDayDialog
        open={!!dayDialog}
        subGroup={dayDialog?.subGroup}
        date={dayDialog?.date}
        rosters={data?.data || []}
        onClose={() => setDayDialog(null)}
      />
    </div>
  );
}

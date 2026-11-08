import { useState, useEffect, useMemo } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "../components/PageHeader";
import { AssignmentStats } from "../components/assignments/AssignmentStats";
import { AssignmentFilterBar } from "../components/assignments/AssignmentFilterBar";
import { AssignmentTimelineView } from "../components/assignments/AssignmentTimelineView";
import { AssignmentDetailDrawer } from "../components/assignments/AssignmentDetailDrawer";
import { AssignmentWizardDialog } from "../components/assignments/AssignmentWizardDialog";
import {
  todayStr,
  fmtDateFull,
} from "../components/assignments/assignmentConstants";
import { useAssignmentsList } from "@/hooks/useAssignments";
import { useStopsList } from "@/hooks/useStops";
import { useRoutesList } from "@/hooks/useRoutes";
import { useVehiclesList } from "@/hooks/useVehicles";

export function AssignmentsAdminPage() {
  const [date, setDate] = useState(todayStr());
  const [depotId, setDepotId] = useState("all");
  const [routeId, setRouteId] = useState("all");
  const [wizardOpen, setWizardOpen] = useState(false);
  const [selected, setSelected] = useState(null);

  const DEMO_DEPOT_IDS = [5909, 5920, 5929];

  const { data: depotsData } = useStopsList({
    page: 1,
    limit: 500,
    stop_type: 1,
  });

  const depots = useMemo(() => {
    const all = depotsData?.data || [];
    return all.filter((d) => DEMO_DEPOT_IDS.includes(d.id));
  }, [depotsData]);

  const { data: routesData } = useRoutesList({ page: 1, limit: 100 });
  const routes = routesData?.data || [];

  const {
    data: assignmentsData,
    isLoading,
    isFetching,
    refetch,
  } = useAssignmentsList({
    date,
    depot_id: depotId === "all" ? undefined : depotId,
    limit: 500,
  });
  const assignments = assignmentsData?.data || [];

  const { data: vehiclesData } = useVehiclesList({
    page: 1,
    limit: 100,
    depot_id: depotId === "all" ? undefined : depotId,
    is_active: true,
  });
  const vehicles = vehiclesData?.data || [];

  useEffect(() => {
    if (selected) {
      const fresh = assignments.find((a) => a.id === selected.id);
      if (fresh && JSON.stringify(fresh) !== JSON.stringify(selected)) {
        setSelected(fresh);
      }
    }
  }, [assignments, selected]);

  return (
    <div className="h-full overflow-y-auto bg-[#EEF2F6]">
      <div className="max-w-[1600px] mx-auto px-6 py-6 space-y-4">
        <PageHeader
          title="Trung tâm điều hành phân công"
          description={fmtDateFull(date)}
        >
          <Button variant="primary" onClick={() => setWizardOpen(true)}>
            <Plus size={14} />
            Tạo phân công
          </Button>
        </PageHeader>

        <AssignmentStats date={date} depotId={depotId} />

        <AssignmentFilterBar
          date={date}
          depotId={depotId}
          routeId={routeId}
          onDateChange={setDate}
          onDepotChange={setDepotId}
          onRouteChange={setRouteId}
          onRefresh={refetch}
          isFetching={isFetching}
          depots={depots}
          routes={routes}
          totalBlocks={assignments.length}
        />

        <AssignmentTimelineView
          assignments={assignments}
          vehicles={depotId === "all" ? [] : vehicles}
          date={date}
          routeId={routeId}
          isLoading={isLoading}
          onSelect={setSelected}
          onAddForVehicle={() => setWizardOpen(true)}
        />
      </div>

      <AssignmentDetailDrawer
        assignment={selected}
        open={!!selected}
        onClose={() => setSelected(null)}
      />

      <AssignmentWizardDialog
        open={wizardOpen}
        onClose={() => setWizardOpen(false)}
        initialDate={date}
      />
    </div>
  );
}

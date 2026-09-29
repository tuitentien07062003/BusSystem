// src/admin/pages/TripsAdminPage.jsx
// Trang Dispatch Center — quản lý và điều hành chuyến xe
import { useState, useEffect, useMemo, useCallback } from "react";
import { Plus, Sparkles, XCircle, BarChart3, ListOrdered } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { PageHeader } from "../components/PageHeader";
import { TripKpiCards } from "../components/trips/TripKpiCards";
import { TripFilterBar } from "../components/trips/TripFilterBar";
import { TripTimelineView } from "../components/trips/TripTimelineView";
import { TripDetailDrawer } from "../components/trips/TripDetailDrawer";
import { TripsTable } from "../components/trips/TripsTable";
import { TripFormDialog } from "../components/trips/TripFormDialog";
import {
  useTripsList,
  useTripsStatsByDate,
  useChangeTripStatus,
} from "@/hooks/useTrips";
import { useRoutesList } from "@/hooks/useRoutes";
import { useFullRoute } from "@/hooks/useRoutes";

// ═══════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════
function today() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

const PAGE_SIZE = 30;

// ═══════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════
export function TripsAdminPage() {
  // ─── Filter state ───
  const [date, setDate] = useState(today());
  const [routeId, setRouteId] = useState("all");
  const [directionId, setDirectionId] = useState("all");
  const [status, setStatus] = useState("all");
  const [searchInput, setSearchInput] = useState("");
  const [keyword, setKeyword] = useState("");

  // ─── View mode ───
  const [viewMode, setViewMode] = useState("timeline"); // 'timeline' | 'table'

  // ─── Selection / Dialog ───
  const [selectedTrip, setSelectedTrip] = useState(null); // mở Drawer
  const [editingTrip, setEditingTrip] = useState(null); // mở Form
  const [formOpen, setFormOpen] = useState(false);
  const [bulkSelectedIds, setBulkSelectedIds] = useState(new Set());

  // ─── Sort (chỉ dùng cho Table) ───
  const [sortBy, setSortBy] = useState("start_time");
  const [sortOrder, setSortOrder] = useState("asc");

  // ─── Debounce search ───
  useEffect(() => {
    const t = setTimeout(() => setKeyword(searchInput), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  // ═══════════════════════════════════════════════════════════════
  // DATA
  // ═══════════════════════════════════════════════════════════════

  // Routes (cho filter)
  const { data: routesData } = useRoutesList({ page: 1, limit: 200 });
  const routes = routesData?.data || [];

  // KPI stats
  const { data: statsData, isLoading: loadingStats } = useTripsStatsByDate(
    date,
    routeId === "all" ? undefined : routeId,
  );

  // Trips list (dùng cho cả Timeline và Table)
  const {
    data: tripsData,
    isLoading,
    isFetching,
    refetch,
  } = useTripsList({
    page: 1,
    limit: 500, // load nhiều hơn cho Timeline
    route_id: routeId === "all" ? undefined : routeId,
    is_active: undefined,
    q: keyword,
  });

  const rawTrips = tripsData?.data ?? [];

  // ═══════════════════════════════════════════════════════════════
  // CLIENT-SIDE FILTER (theo direction + status + date)
  // ═══════════════════════════════════════════════════════════════
  const filteredTrips = useMemo(() => {
    let list = [...rawTrips];

    // Filter direction
    if (directionId !== "all") {
      const d = parseInt(directionId);
      list = list.filter((t) => t.direction_id === d);
    }

    // Filter status
    if (status === "cancelled") {
      list = list.filter((t) => t.is_active === false);
    } else if (status !== "all") {
      // scheduled / in_progress / completed: filter theo thời gian
      const isToday = date === today();
      const now = new Date();
      const nowMin = now.getHours() * 60 + now.getMinutes();

      list = list.filter((t) => {
        if (t.is_active === false) return false;
        const [h, m] = String(t.start_time).split(":").map(Number);
        const startMin = h * 60 + m;
        const travelMin = Math.round((t.travel_time_sec || 3600) / 60);
        const endMin = startMin + travelMin;

        if (!isToday) return status === "scheduled";
        if (status === "scheduled") return nowMin < startMin;
        if (status === "in_progress")
          return nowMin >= startMin && nowMin < endMin;
        if (status === "completed") return nowMin >= endMin;
        return true;
      });
    }

    // Sort
    list.sort((a, b) => {
      const av = a[sortBy];
      const bv = b[sortBy];
      if (av == null) return 1;
      if (bv == null) return -1;
      if (typeof av === "string") {
        return sortOrder === "asc"
          ? av.localeCompare(bv, "vi")
          : bv.localeCompare(av, "vi");
      }
      return sortOrder === "asc" ? av - bv : bv - av;
    });

    return list;
  }, [rawTrips, directionId, status, date, sortBy, sortOrder]);

  // ═══════════════════════════════════════════════════════════════
  // HANDLERS
  // ═══════════════════════════════════════════════════════════════

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder((o) => (o === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
  };

  const handleSelectTrip = (trip) => {
    setSelectedTrip(trip);
  };

  const handleEditTrip = (trip) => {
    setEditingTrip(trip);
    setFormOpen(true);
  };

  const handleCloseForm = () => {
    setFormOpen(false);
    setEditingTrip(null);
  };

  const handleOpenCreate = () => {
    setEditingTrip(null);
    setFormOpen(true);
  };

  const handleBulkCancel = async () => {
    if (bulkSelectedIds.size === 0) {
      toast.warning("Chưa chọn chuyến nào");
      return;
    }
    if (!confirm(`Hủy ${bulkSelectedIds.size} chuyến đã chọn?`)) return;
    toast.info("Chức năng đang phát triển");
    setBulkSelectedIds(new Set());
  };

  // ═══════════════════════════════════════════════════════════════
  // DATA cho Drawer
  // ═══════════════════════════════════════════════════════════════
  const { data: fullRouteData } = useFullRoute(selectedTrip?.route_id ?? null, {
    enabled: !!selectedTrip?.route_id,
  });

  const drawerStopTimes = useMemo(() => {
    if (!selectedTrip || !fullRouteData?.patterns) return [];
    const pattern = fullRouteData.patterns.find(
      (p) => p.direction_id === selectedTrip.direction_id,
    );
    return pattern?.stops || [];
  }, [selectedTrip, fullRouteData]);

  const drawerShape = useMemo(() => {
    if (!selectedTrip || !fullRouteData?.patterns) return null;
    const pattern = fullRouteData.patterns.find(
      (p) => p.direction_id === selectedTrip.direction_id,
    );
    return pattern?.shape || null;
  }, [selectedTrip, fullRouteData]);

  const drawerStops = useMemo(() => {
    if (!selectedTrip || !fullRouteData?.patterns) return [];
    const pattern = fullRouteData.patterns.find(
      (p) => p.direction_id === selectedTrip.direction_id,
    );
    return (pattern?.stops || []).map((s) => ({
      stop_id: s.stop_id,
      stop_name: s.stop_name,
      latitude: s.latitude,
      longitude: s.longitude,
      stop_type: s.stop_type,
    }));
  }, [selectedTrip, fullRouteData]);

  // ═══════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════
  return (
    <div className="h-full overflow-y-auto bg-[#EEF2F6] scrollbar-thin">
      <div className="max-w-[1600px] mx-auto px-6 py-5 space-y-4">
        {/* ═══════════ PAGE HEADER ═══════════ */}
        <PageHeader
          title="Trung tâm điều hành chuyến xe"
          description="Theo dõi, điều chỉnh và quản lý lịch chạy theo thời gian thực"
        >
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              onClick={handleBulkCancel}
              disabled={bulkSelectedIds.size === 0}
              className="border-[#FFC8C8] text-[#C62828] hover:bg-[#FEF2F2]"
            >
              <XCircle size={13} />
              Hủy hàng loạt
              {bulkSelectedIds.size > 0 && (
                <Badge variant="danger" className="ml-1 text-[10px]">
                  {bulkSelectedIds.size}
                </Badge>
              )}
            </Button>

            <Button
              variant="outline"
              onClick={handleOpenCreate}
              className="border-[#169BA2] text-[#169BA2] hover:bg-[#E6F4F5]"
            >
              <Plus size={13} />
              Thêm chuyến gấp
            </Button>
          </div>
        </PageHeader>

        {/* ═══════════ KPI CARDS ═══════════ */}
        <TripKpiCards stats={statsData} isLoading={loadingStats} />

        {/* ═══════════ FILTER BAR ═══════════ */}
        <TripFilterBar
          date={date}
          routeId={routeId}
          directionId={directionId}
          status={status}
          searchInput={searchInput}
          onDateChange={setDate}
          onRouteChange={setRouteId}
          onDirectionChange={setDirectionId}
          onStatusChange={setStatus}
          onSearchChange={setSearchInput}
          routes={routes}
          onRefresh={refetch}
          isFetching={isFetching}
        />

        {/* ═══════════ VIEW MODE SWITCH ═══════════ */}
        <div className="flex items-center justify-between">
          <div className="inline-flex items-center bg-white rounded-lg border border-[#E5EAF0] p-1">
            <button
              type="button"
              onClick={() => setViewMode("timeline")}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                viewMode === "timeline"
                  ? "bg-[#169BA2] text-white shadow-sm"
                  : "text-[#6A7A9A] hover:bg-[#F8FAFC]"
              }`}
            >
              <BarChart3 size={13} />
              Biểu đồ Timeline
            </button>
            <button
              type="button"
              onClick={() => setViewMode("table")}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                viewMode === "table"
                  ? "bg-[#169BA2] text-white shadow-sm"
                  : "text-[#6A7A9A] hover:bg-[#F8FAFC]"
              }`}
            >
              <ListOrdered size={13} />
              Bảng danh sách
            </button>
          </div>

          <div className="text-xs text-[#6A7A9A]">
            Hiển thị <b className="text-[#1A2332]">{filteredTrips.length}</b>{" "}
            chuyến
          </div>
        </div>

        {/* ═══════════ MAIN VIEW ═══════════ */}
        {viewMode === "timeline" ? (
          <TripTimelineView
            trips={filteredTrips}
            routes={routes}
            date={date}
            onSelectTrip={handleSelectTrip}
          />
        ) : (
          <TripsTable
            trips={filteredTrips}
            isLoading={isLoading}
            onEdit={handleEditTrip}
            onSelect={handleSelectTrip}
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSort={handleSort}
          />
        )}
      </div>

      {/* ═══════════ DRAWER — Chi tiết chuyến ═══════════ */}
      <TripDetailDrawer
        open={!!selectedTrip}
        trip={selectedTrip}
        onClose={() => setSelectedTrip(null)}
        stopTimes={drawerStopTimes}
        routeShape={drawerShape}
        routeStops={drawerStops}
        isLoadingStops={!fullRouteData && !!selectedTrip?.route_id}
        isLoadingShape={!fullRouteData && !!selectedTrip?.route_id}
      />

      {/* ═══════════ DIALOG — Sửa / tạo chuyến ═══════════ */}
      <TripFormDialog
        trip={editingTrip}
        open={formOpen}
        onOpenChange={(v) => {
          setFormOpen(v);
          if (!v) setEditingTrip(null);
        }}
      />
    </div>
  );
}

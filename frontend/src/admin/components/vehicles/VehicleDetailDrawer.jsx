import { useEffect, useState, useMemo } from "react";
import {
  X,
  Loader2,
  MapPin,
  Battery,
  Route as RouteIcon,
  CalendarDays,
  AlertTriangle,
  Info,
  Zap,
} from "lucide-react";
import { VehicleIcon } from "./VehicleIcon";
import {
  VEHICLE_TYPE_LABELS,
  VEHICLE_TYPE_STYLES,
  UNKNOWN,
} from "./vehicleConstants";
import { useAssignmentsList } from "@/hooks/useAssignments";
import { useIncidentsList } from "@/hooks/useIncidents";

// ─── Helpers ───
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

function fmtDateShort(s) {
  if (!s) return UNKNOWN;
  try {
    const d = new Date(s);
    return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
  } catch {
    return UNKNOWN;
  }
}

function fmtTime(t) {
  if (!t) return UNKNOWN;
  return String(t).slice(0, 5);
}

// ─── Overview tab ───
function OverviewTab({ vehicle }) {
  const typeCode = vehicle.type_code || "BUS_45";
  const isElectric = typeCode === "EBUS_60";

  const items = [
    {
      icon: MapPin,
      label: "Biển số",
      value: vehicle.license_plate,
      mono: true,
    },
    {
      icon: MapPin,
      label: "Depot",
      value: vehicle.depot_id ? `Depot #${vehicle.depot_id}` : UNKNOWN,
    },
    {
      icon: RouteIcon,
      label: "Số chỗ ngồi",
      value: vehicle.capacity_seated || UNKNOWN,
    },
    ...(isElectric
      ? [
          {
            icon: Battery,
            label: "Dung lượng pin",
            value: vehicle.battery_capacity_kwh
              ? `${vehicle.battery_capacity_kwh} kWh`
              : UNKNOWN,
          },
          {
            icon: Zap,
            label: "Quãng đường tối đa",
            value: vehicle.range_km ? `${vehicle.range_km} km` : UNKNOWN,
          },
        ]
      : []),
    {
      icon: CalendarDays,
      label: "Ngày tạo",
      value: fmtDate(vehicle.created_at),
    },
  ];

  return (
    <div className="space-y-1">
      {items.map((item, i) => (
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
            <div
              className={`text-sm text-[#1A2332] font-medium truncate ${
                item.mono ? "font-mono" : ""
              }`}
            >
              {item.value}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Assignments tab ───
function AssignmentsTab({ vehicle }) {
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
    vehicle_id: vehicle.id,
    from: pastFrom,
    to: pastTo,
    limit: 20,
  });

  const { data: futureData, isLoading: loadingFuture } = useAssignmentsList({
    vehicle_id: vehicle.id,
    from: pastTo,
    to: futureTo,
    limit: 20,
  });

  const [subTab, setSubTab] = useState("upcoming");
  const isLoading = loadingPast || loadingFuture;
  const upcoming = futureData?.data || [];
  const past = pastData?.data || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 size={20} className="animate-spin text-[#169BA2]" />
      </div>
    );
  }

  const assignments = subTab === "upcoming" ? upcoming : past;

  return (
    <div className="space-y-3">
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

      {assignments.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-12 h-12 rounded-full bg-[#F8FAFC] flex items-center justify-center mx-auto mb-3">
            <RouteIcon size={20} className="text-[#B0BCCA]" />
          </div>
          <div className="text-sm font-medium text-[#4A5A7A] mb-1">
            {subTab === "upcoming"
              ? "Xe chưa có ca chạy sắp tới"
              : "Xe chưa có ca chạy 30 ngày qua"}
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {assignments.map((a) => (
            <div
              key={a.id}
              className="bg-white rounded-lg border border-[#E5EAF0] p-3"
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-xs font-bold text-[#1A2332] font-mono">
                  {fmtDate(a.date)} · {fmtTime(a.start_time)}–
                  {fmtTime(a.end_time)}
                </span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#F8FAFC] text-[#4A5A7A]">
                  {a.status}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div>
                  <div className="text-[9px] uppercase tracking-wider text-[#8A9AAA]">
                    Tài xế
                  </div>
                  <div className="text-[#1A2332] font-medium">
                    {a.driver?.employee_code || UNKNOWN}
                  </div>
                </div>
                <div>
                  <div className="text-[9px] uppercase tracking-wider text-[#8A9AAA]">
                    Tuyến
                  </div>
                  <div className="text-[#1A2332] font-medium">
                    #{a.route_id}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Incidents tab ───
function IncidentsTab({ vehicle }) {
  const { data, isLoading } = useIncidentsList({
    vehicle_id: vehicle.id,
    limit: 30,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 size={20} className="animate-spin text-[#169BA2]" />
      </div>
    );
  }

  const incidents = data?.data || [];

  if (incidents.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-12 h-12 rounded-full bg-[#F8FAFC] flex items-center justify-center mx-auto mb-3">
          <AlertTriangle size={20} className="text-[#B0BCCA]" />
        </div>
        <div className="text-sm font-medium text-[#4A5A7A] mb-1">
          Xe chưa gặp sự cố nào
        </div>
      </div>
    );
  }

  const typeLabels = {
    accident: "Tai nạn",
    traffic_jam: "Kẹt xe",
    breakdown: "Hỏng xe",
    passenger_emergency: "Khẩn cấp hành khách",
    other: "Khác",
  };

  const severityStyles = {
    low: "text-[#4A5A7A] bg-[#F8FAFC] border-[#E5EAF0]",
    medium: "text-[#E08940] bg-[#FEF3E2] border-[#FCD9A0]",
    high: "text-[#C62828] bg-[#FEF2F2] border-[#FFC8C8]",
    critical: "text-white bg-[#C62828] border-[#C62828]",
  };

  const statusStyles = {
    reported: "text-[#E08940] bg-[#FEF3E2]",
    acknowledged: "text-[#169BA2] bg-[#E6F4F5]",
    resolved: "text-[#2E7D32] bg-[#F1F8F1]",
    closed: "text-[#8A9AAA] bg-[#F8FAFC]",
  };

  return (
    <div className="space-y-2">
      {incidents.map((inc) => (
        <div
          key={inc.id}
          className="bg-white rounded-lg border border-[#E5EAF0] p-3"
        >
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-mono font-bold text-[#1A2332]">
                {inc.incident_code}
              </span>
              <span
                className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${severityStyles[inc.severity]}`}
              >
                {inc.severity}
              </span>
            </div>
            <span
              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${statusStyles[inc.status]}`}
            >
              {inc.status}
            </span>
          </div>

          <div className="text-xs text-[#1A2332] font-medium mb-1">
            {typeLabels[inc.type] || inc.type}
          </div>

          {inc.description && (
            <div className="text-[11px] text-[#6A7A9A] leading-relaxed line-clamp-2">
              {inc.description}
            </div>
          )}

          <div className="text-[10px] text-[#8A9AAA] font-mono mt-2 pt-2 border-t border-[#F0F3F7]">
            {fmtDate(inc.created_at)}
          </div>
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// MAIN DRAWER
// ═══════════════════════════════════════════════════════════════
export function VehicleDetailDrawer({ vehicle, open, onClose }) {
  const [tab, setTab] = useState("overview");

  useEffect(() => {
    if (open) setTab("overview");
  }, [open, vehicle?.id]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || !vehicle) return null;

  const typeCode = vehicle.type_code || "BUS_45";
  const typeStyle = VEHICLE_TYPE_STYLES[typeCode] || VEHICLE_TYPE_STYLES.BUS_45;

  const TABS = [
    { id: "overview", label: "Tổng quan", icon: Info },
    { id: "assignments", label: "Ca chạy", icon: RouteIcon },
    { id: "incidents", label: "Sự cố", icon: AlertTriangle },
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
        <header className="flex-shrink-0 border-b border-[#E5EAF0] bg-white">
          <div className="flex items-start gap-3 px-5 py-4">
            <VehicleIcon vehicleTypeCode={typeCode} size="lg" />
            <div className="flex-1 min-w-0 pt-1">
              <div className="text-base font-bold text-[#1A2332] leading-tight font-mono mb-1">
                {vehicle.vehicle_code}
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] text-[#8A9AAA] font-mono">
                  {vehicle.license_plate}
                </span>
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${typeStyle.bg} ${typeStyle.text} ${typeStyle.border}`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${typeStyle.dot}`}
                  />
                  {VEHICLE_TYPE_LABELS[typeCode] || typeCode}
                </span>
                {vehicle.is_active !== false ? (
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

          <div className="flex border-t border-[#E5EAF0]">
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`flex-1 inline-flex items-center justify-center gap-1.5 py-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
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

        <div className="flex-1 overflow-y-auto px-5 py-4 scrollbar-thin">
          {tab === "overview" && <OverviewTab vehicle={vehicle} />}
          {tab === "assignments" && <AssignmentsTab vehicle={vehicle} />}
          {tab === "incidents" && <IncidentsTab vehicle={vehicle} />}
        </div>
      </div>
    </>
  );
}

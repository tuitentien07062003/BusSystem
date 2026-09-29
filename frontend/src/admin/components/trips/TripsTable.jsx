// src/admin/components/trips/TripsTable.jsx
// Bảng danh sách chuyến — layout dispatch center
// Cột: Mã chuyến | Tuyến | Hướng | Giờ xuất bến | Lịch | Trạng thái | Thao tác
import { Pencil, Power, PowerOff } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import { useChangeTripStatus } from "@/hooks/useTrips";

// ═══════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════
function fmtTime(t) {
  if (!t) return "—";
  return String(t).slice(0, 5);
}

function fmtDate(s) {
  if (!s) return "—";
  try {
    return new Date(s).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}

// ─── Badge ngày chạy trong tuần ───
function ServiceDaysBadges({ days }) {
  if (!days) return null;
  const labels = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];
  const keys = [
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday",
  ];

  return (
    <div className="flex gap-0.5">
      {keys.map((k, i) => (
        <span
          key={k}
          className={`text-[9px] w-4 h-4 rounded flex items-center justify-center font-bold ${
            days[k] ? "bg-[#169BA2] text-white" : "bg-[#F0F3F7] text-[#B0BCCA]"
          }`}
        >
          {labels[i]}
        </span>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════
export function TripsTable({
  trips,
  isLoading,
  onEdit,
  onSelect,
  sortBy,
  sortOrder,
  onSort,
}) {
  const statusMut = useChangeTripStatus();

  const columns = [
    // ─── 1. Mã chuyến ───
    {
      key: "trip_id",
      label: "Mã chuyến",
      sortable: true,
      width: 160,
      render: (r) => (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onSelect?.(r);
          }}
          className="font-mono text-[11px] font-semibold text-[#169BA2] hover:underline cursor-pointer text-left truncate max-w-[150px]"
          title={r.trip_id}
        >
          {r.trip_id}
        </button>
      ),
    },

    // ─── 2. Tuyến ───
    {
      key: "route_short_name",
      label: "Tuyến",
      sortable: true,
      width: 140,
      render: (r) => (
        <div className="flex items-center gap-2 min-w-0">
          <span
            className="w-1 h-5 rounded-full flex-shrink-0"
            style={{ background: r.route_color || "#169BA2" }}
          />
          <div className="min-w-0">
            <div className="text-xs font-semibold text-[#1A2332] truncate">
              {r.route_short_name || "—"}
            </div>
            <div className="text-[9px] text-[#8A9AAA] font-mono">
              {r.route_code || "—"}
            </div>
          </div>
        </div>
      ),
    },

    // ─── 3. Hướng (biển hiệu) ───
    {
      key: "trip_headsign",
      label: "Hướng đi",
      render: (r) => (
        <div className="min-w-0 max-w-[240px]">
          <div
            className="text-[11px] text-[#4A5A7A] truncate"
            title={r.trip_headsign}
          >
            {r.trip_headsign || "—"}
          </div>
          {r.direction_id != null && (
            <div className="text-[9px] text-[#8A9AAA] mt-0.5">
              {r.direction_id === 0 ? "Chiều đi" : "Chiều về"}
            </div>
          )}
        </div>
      ),
    },

    // ─── 4. Giờ xuất bến ───
    {
      key: "start_time",
      label: "Xuất bến",
      sortable: true,
      width: 100,
      align: "center",
      render: (r) => (
        <span className="font-mono text-sm font-bold text-[#1A2332]">
          {fmtTime(r.start_time)}
        </span>
      ),
    },

    // ─── 5. Lịch áp dụng ───
    {
      key: "service_code",
      label: "Lịch áp dụng",
      width: 160,
      render: (r) => (
        <div className="space-y-1">
          <div className="text-[11px] font-semibold text-[#1A2332]">
            {r.service_code || "—"}
          </div>
          {r.service_days && <ServiceDaysBadges days={r.service_days} />}
        </div>
      ),
    },

    // ─── 6. Pattern code ───
    {
      key: "pattern_code",
      label: "Pattern",
      width: 120,
      render: (r) => (
        <span className="font-mono text-[10px] text-[#8A9AAA] truncate block">
          {r.pattern_code || "—"}
        </span>
      ),
    },

    // ─── 7. Ngày tạo ───
    {
      key: "created_at",
      label: "Ngày tạo",
      sortable: true,
      width: 100,
      render: (r) => (
        <span className="text-[10px] text-[#8A9AAA] font-mono">
          {fmtDate(r.created_at)}
        </span>
      ),
    },

    // ─── 8. Trạng thái ───
    {
      key: "is_active",
      label: "Trạng thái",
      align: "center",
      width: 120,
      render: (r) =>
        r.is_active !== false ? (
          <Badge variant="success">Hoạt động</Badge>
        ) : (
          <Badge variant="danger">Đã hủy</Badge>
        ),
    },

    // ─── 9. Thao tác ───
    {
      key: "actions",
      label: "Thao tác",
      align: "center",
      width: 100,
      render: (r) => (
        <div className="flex items-center justify-center gap-1">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onEdit?.(r);
            }}
            title="Sửa chuyến"
            className="h-7 w-7 rounded-md border border-[#D0D7E2] bg-white hover:bg-[#F8FAFC] hover:border-[#169BA2] flex items-center justify-center cursor-pointer transition-colors"
          >
            <Pencil size={12} className="text-[#169BA2]" />
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              statusMut.mutate({
                id: r.id,
                is_active: !(r.is_active !== false),
              });
            }}
            disabled={statusMut.isPending}
            title={r.is_active !== false ? "Hủy chuyến" : "Kích hoạt"}
            className={`h-7 w-7 rounded-md border flex items-center justify-center cursor-pointer transition-colors disabled:opacity-50 ${
              r.is_active !== false
                ? "border-[#F5B7B1] bg-white hover:bg-[#FEF2F2]"
                : "border-[#A8D5A8] bg-white hover:bg-[#F1F8F1]"
            }`}
          >
            {r.is_active !== false ? (
              <PowerOff size={12} className="text-[#C62828]" />
            ) : (
              <Power size={12} className="text-[#2E7D32]" />
            )}
          </button>
        </div>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      rows={trips}
      isLoading={isLoading}
      emptyMessage="Chưa có chuyến nào"
      sortBy={sortBy}
      sortOrder={sortOrder}
      onSort={onSort}
      onRowClick={onSelect}
    />
  );
}

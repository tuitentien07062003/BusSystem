import { Pencil, Power, PowerOff } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import { useChangeEmployeeStatus } from "@/hooks/useEmployees";
import { EMPLOYEE_TYPE_LABELS } from "./employeeConstants";

function formatDate(s) {
  if (!s) return "—";
  try {
    return new Date(s).toLocaleDateString("vi-VN");
  } catch {
    return "—";
  }
}

function TypeBadge({ type }) {
  const variants = {
    driver: "info",
    co_driver: "success",
    depot_staff: "warning",
    dispatcher: "muted",
  };
  return (
    <Badge variant={variants[type] || "muted"}>
      {EMPLOYEE_TYPE_LABELS[type] || type}
    </Badge>
  );
}

function LicenseCell({ row }) {
  if (row.type !== "driver" && row.type !== "co_driver") {
    return <span className="text-xs text-[#B0BCCA]">—</span>;
  }
  if (!row.license_class && !row.license_number) {
    return <span className="text-xs text-[#B0BCCA]">Chưa có</span>;
  }

  const isExpired =
    row.license_expiry && new Date(row.license_expiry) < new Date();

  return (
    <div className="space-y-0.5">
      <div className="text-xs text-[#1A2332] font-mono">
        {row.license_class || "—"}
        {row.license_number ? ` · ${row.license_number}` : ""}
      </div>
      {row.license_expiry && (
        <div
          className={`text-[10px] ${
            isExpired ? "text-[#C62828] font-semibold" : "text-[#8A9AAA]"
          }`}
        >
          Hết hạn: {formatDate(row.license_expiry)}
        </div>
      )}
    </div>
  );
}

export function EmployeesTable({
  employees,
  isLoading,
  onEdit,
  sortBy,
  sortOrder,
  onSort,
}) {
  const statusMut = useChangeEmployeeStatus();

  const columns = [
    {
      key: "id",
      label: "ID",
      sortable: true,
      width: 60,
      render: (r) => (
        <span className="text-[#6A7A9A] font-mono text-xs">{r.id}</span>
      ),
    },
    {
      key: "employee_code",
      label: "Mã nhân viên",
      sortable: true,
      width: 130,
      render: (r) => (
        <span className="font-mono text-xs text-[#169BA2] font-semibold">
          {r.employee_code}
        </span>
      ),
    },
    {
      key: "full_name",
      label: "Họ tên",
      sortable: true,
      render: (r) => (
        <span className="font-medium text-[#1A2332]">{r.full_name}</span>
      ),
    },
    {
      key: "type",
      label: "Loại",
      align: "center",
      width: 130,
      render: (r) => <TypeBadge type={r.type} />,
    },
    {
      key: "phone",
      label: "Điện thoại",
      width: 120,
      render: (r) => (
        <span className="text-xs text-[#4A5A7A] font-mono">
          {r.phone || "—"}
        </span>
      ),
    },
    {
      key: "email",
      label: "Email",
      render: (r) => (
        <span className="text-xs text-[#4A5A7A] truncate block max-w-[180px]">
          {r.email || "—"}
        </span>
      ),
    },
    {
      key: "license",
      label: "Bằng lái",
      width: 170,
      render: (r) => <LicenseCell row={r} />,
    },
    {
      key: "hire_date",
      label: "Ngày vào làm",
      sortable: true,
      width: 110,
      render: (r) => (
        <span className="text-xs text-[#6A7A9A]">
          {formatDate(r.hire_date)}
        </span>
      ),
    },
    {
      key: "is_active",
      label: "Trạng thái",
      align: "center",
      width: 120,
      render: (r) =>
        r.is_active ? (
          <Badge variant="success">Hoạt động</Badge>
        ) : (
          <Badge variant="danger">Ngưng</Badge>
        ),
    },
    {
      key: "actions",
      label: "Hành động",
      align: "center",
      width: 100,
      render: (r) => (
        <div className="flex items-center justify-center gap-1">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(r);
            }}
            title="Sửa thông tin"
            className="h-7 w-7 rounded-md border border-[#CBD5E1] bg-white hover:bg-[#EEF2F6] flex items-center justify-center cursor-pointer"
          >
            <Pencil size={12} className="text-[#169BA2]" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              statusMut.mutate({ id: r.id, is_active: !r.is_active });
            }}
            disabled={statusMut.isPending}
            title={r.is_active ? "Ngưng hoạt động" : "Kích hoạt"}
            className={`h-7 w-7 rounded-md border flex items-center justify-center cursor-pointer disabled:opacity-50 ${
              r.is_active
                ? "border-[#F5B7B1] bg-white hover:bg-[#FDE8E8]"
                : "border-[#A8D5D8] bg-white hover:bg-[#E6F4F5]"
            }`}
          >
            {r.is_active ? (
              <PowerOff size={12} className="text-[#C0392B]" />
            ) : (
              <Power size={12} className="text-[#169BA2]" />
            )}
          </button>
        </div>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      rows={employees}
      isLoading={isLoading}
      emptyMessage="Chưa có nhân viên nào"
      sortBy={sortBy}
      sortOrder={sortOrder}
      onSort={onSort}
    />
  );
}

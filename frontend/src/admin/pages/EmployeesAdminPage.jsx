import { useState, useEffect, useMemo, useCallback } from "react";
import { Plus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "../components/PageHeader";
import { EmployeeFilterBar } from "../components/employees/EmployeeFilterBar";
import { EmployeesTable } from "../components/employees/EmployeesTable";
import { EmployeeCard } from "../components/employees/EmployeeCard";
import { EmployeeDetailDrawer } from "../components/employees/EmployeeDetailDrawer";
import { EmployeeFormDialog } from "../components/employees/EmployeeFormDialog";
import { useEmployeesList } from "@/hooks/useEmployees";

const PAGE_SIZE = 24;
const NUMERIC_COLS = new Set(["id"]);

function compareRows(a, b, col, order) {
  const av = a[col];
  const bv = b[col];
  if (av == null) return 1;
  if (bv == null) return -1;
  if (NUMERIC_COLS.has(col)) {
    return order === "asc" ? Number(av) - Number(bv) : Number(bv) - Number(av);
  }
  const as = String(av).toLowerCase();
  const bs = String(bv).toLowerCase();
  return order === "asc"
    ? as.localeCompare(bs, "vi")
    : bs.localeCompare(as, "vi");
}

export function EmployeesAdminPage() {
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [keyword, setKeyword] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [viewMode, setViewMode] = useState("grid");
  const [sortBy, setSortBy] = useState("id");
  const [sortOrder, setSortOrder] = useState("asc");

  const [editing, setEditing] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [viewing, setViewing] = useState(null);

  // Debounce
  useEffect(() => {
    const t = setTimeout(() => {
      setKeyword(searchInput);
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    setPage(1);
  }, [typeFilter, statusFilter]);

  const typeParam = typeFilter === "all" ? undefined : typeFilter;
  const isActiveParam =
    statusFilter === "all" ? undefined : statusFilter === "true";

  const { data, isLoading, isFetching, refetch } = useEmployeesList({
    page,
    limit: PAGE_SIZE,
    type: typeParam,
    is_active: isActiveParam,
    q: keyword,
  });

  const raw = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;

  const employees = useMemo(() => {
    const list = [...raw];
    list.sort((a, b) => compareRows(a, b, sortBy, sortOrder));
    return list;
  }, [raw, sortBy, sortOrder]);

  const handleSort = useCallback(
    (field) => {
      if (sortBy === field) setSortOrder((o) => (o === "asc" ? "desc" : "asc"));
      else {
        setSortBy(field);
        setSortOrder("asc");
      }
    },
    [sortBy],
  );

  const handleOpenCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const handleOpenEdit = (row) => {
    setEditing(row);
    setFormOpen(true);
  };

  const handleView = (row) => setViewing(row);

  return (
    <div className="h-full overflow-y-auto bg-[#EEF2F6]">
      <div className="max-w-[1400px] mx-auto px-6 py-6 space-y-4">
        {/* Header */}
        <PageHeader
          title="Quản lý nhân viên"
          description="Tài xế, lơ xe, nhân viên depot và điều độ viên"
        >
          <Button variant="primary" onClick={handleOpenCreate}>
            <Plus size={14} />
            Thêm nhân viên
          </Button>
        </PageHeader>

        {/* Filter */}
        <EmployeeFilterBar
          searchInput={searchInput}
          typeFilter={typeFilter}
          statusFilter={statusFilter}
          viewMode={viewMode}
          onSearchChange={setSearchInput}
          onTypeChange={setTypeFilter}
          onStatusChange={setStatusFilter}
          onViewModeChange={setViewMode}
          onRefresh={refetch}
          isFetching={isFetching}
        />

        {/* Content */}
        {isLoading ? (
          <div className="bg-white rounded-xl border border-[#E5EAF0] py-16 flex flex-col items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#169BA2] border-t-transparent mb-3" />
            <p className="text-xs text-[#8A9AAA]">Đang tải nhân viên...</p>
          </div>
        ) : employees.length === 0 ? (
          <div className="bg-white rounded-xl border border-dashed border-[#D0D7E2] py-16 px-6 flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full bg-[#F8FAFC] flex items-center justify-center mb-4">
              <Users size={26} className="text-[#B0BCCA]" />
            </div>
            <h3 className="text-sm font-bold text-[#1A2332] mb-1">
              Không có nhân viên nào
            </h3>
            <p className="text-xs text-[#8A9AAA] max-w-sm">
              {keyword || typeFilter !== "all" || statusFilter !== "all"
                ? "Không khớp với bộ lọc hiện tại. Thử đổi từ khóa hoặc bỏ lọc."
                : "Danh sách sẽ hiển thị khi bạn thêm nhân viên đầu tiên."}
            </p>
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {employees.map((e) => (
              <EmployeeCard
                key={e.id}
                employee={e}
                onView={handleView}
                onEdit={handleOpenEdit}
              />
            ))}
          </div>
        ) : (
          <EmployeesTable
            employees={employees}
            isLoading={false}
            onEdit={handleOpenEdit}
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSort={handleSort}
          />
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between text-xs text-[#6A7A9A]">
            <span>
              Trang <b className="text-[#1A2332]">{page}</b> / {totalPages} ·
              Tổng{" "}
              <b className="text-[#1A2332]">{total.toLocaleString("vi-VN")}</b>{" "}
              nhân viên
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => p - 1)}
                disabled={page <= 1}
                className="h-8 px-3 rounded-md border border-[#CBD5E1] bg-white text-xs font-semibold disabled:opacity-40 cursor-pointer"
              >
                Trước
              </button>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= totalPages}
                className="h-8 px-3 rounded-md border border-[#CBD5E1] bg-white text-xs font-semibold disabled:opacity-40 cursor-pointer"
              >
                Sau
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Drawer chi tiết */}
      <EmployeeDetailDrawer
        employee={viewing}
        open={!!viewing}
        onClose={() => setViewing(null)}
      />

      {/* Dialog tạo/sửa */}
      <EmployeeFormDialog
        employee={editing}
        open={formOpen}
        onOpenChange={(v) => {
          setFormOpen(v);
          if (!v) setEditing(null);
        }}
      />
    </div>
  );
}

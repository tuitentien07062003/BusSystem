import { useState, useEffect, useMemo } from "react";
import { Plus, Bus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "../components/PageHeader";
import { VehicleFilterBar } from "../components/vehicles/VehicleFilterBar";
import { VehicleCard } from "../components/vehicles/VehicleCard";
import { VehicleDetailDrawer } from "../components/vehicles/VehicleDetailDrawer";
import { useVehiclesList } from "@/hooks/useVehicles";

const PAGE_SIZE = 10;

export function VehiclesAdminPage() {
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [keyword, setKeyword] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [depotFilter, setDepotFilter] = useState("all");
  const [viewing, setViewing] = useState(null);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => {
      setKeyword(searchInput);
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    setPage(1);
  }, [typeFilter, statusFilter, depotFilter]);

  const typeParam = typeFilter === "all" ? undefined : typeFilter;
  const isActiveParam =
    statusFilter === "all" ? undefined : statusFilter === "true";
  const depotParam = depotFilter === "all" ? undefined : depotFilter;

  const { data, isLoading, isFetching, refetch } = useVehiclesList({
    page,
    limit: PAGE_SIZE,
    vehicle_type_id: typeParam,
    is_active: isActiveParam,
    depot_id: depotParam,
    q: keyword,
  });

  const vehicles = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;

  const depots = [
    { id: 1, name: "Bến Thành" },
    { id: 2, name: "Miền Tây" },
    { id: 3, name: "Vinhomes" },
  ];

  return (
    <div className="h-full overflow-y-auto bg-[#EEF2F6]">
      <div className="max-w-[1400px] mx-auto px-6 py-6 space-y-4">
        <PageHeader
          title="Quản lý xe"
          description="Đội xe buýt — thông tin, lịch chạy và sự cố"
        >
          <Button variant="primary" disabled title="Sẽ làm sau">
            <Plus size={14} />
            Thêm xe
          </Button>
        </PageHeader>

        <VehicleFilterBar
          searchInput={searchInput}
          typeFilter={typeFilter}
          statusFilter={statusFilter}
          depotFilter={depotFilter}
          onSearchChange={setSearchInput}
          onTypeChange={setTypeFilter}
          onStatusChange={setStatusFilter}
          onDepotChange={setDepotFilter}
          onRefresh={refetch}
          isFetching={isFetching}
          depots={depots}
        />

        {isLoading ? (
          <div className="bg-white rounded-xl border border-[#E5EAF0] py-16 flex flex-col items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#169BA2] border-t-transparent mb-3" />
            <p className="text-xs text-[#8A9AAA]">Đang tải xe...</p>
          </div>
        ) : vehicles.length === 0 ? (
          <div className="bg-white rounded-xl border border-dashed border-[#D0D7E2] py-16 px-6 flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full bg-[#F8FAFC] flex items-center justify-center mb-4">
              <Bus size={26} className="text-[#B0BCCA]" />
            </div>
            <h3 className="text-sm font-bold text-[#1A2332] mb-1">
              Không có xe nào
            </h3>
            <p className="text-xs text-[#8A9AAA] max-w-sm">
              {keyword ||
              typeFilter !== "all" ||
              statusFilter !== "all" ||
              depotFilter !== "all"
                ? "Không khớp với bộ lọc hiện tại."
                : "Danh sách sẽ hiển thị khi bạn thêm xe đầu tiên."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {vehicles.map((v) => (
              <VehicleCard
                key={v.id}
                vehicle={v}
                onView={setViewing}
                onEdit={() => {}}
              />
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between text-xs text-[#6A7A9A]">
            <span>
              Trang <b className="text-[#1A2332]">{page}</b> / {totalPages} ·
              Tổng{" "}
              <b className="text-[#1A2332]">{total.toLocaleString("vi-VN")}</b>{" "}
              xe
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

      <VehicleDetailDrawer
        vehicle={viewing}
        open={!!viewing}
        onClose={() => setViewing(null)}
      />
    </div>
  );
}

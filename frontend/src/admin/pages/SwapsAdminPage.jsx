import { useState, useMemo, useEffect } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "../components/PageHeader";
import { SwapFilterBar } from "../components/swaps/SwapFilterBar";
import { SwapTable } from "../components/swaps/SwapTable";
import { SwapDetailDrawer } from "../components/swaps/SwapDetailDrawer";
import { SwapWizardDialog } from "../components/swaps/SwapWizardDialog";
import { todayStr } from "../components/swaps/swapConstants";
import { useSwapsList, useDeleteSwap } from "@/hooks/useShiftSwaps";

function minusDays(dateStr, days) {
  const d = new Date(dateStr);
  d.setDate(d.getDate() - days);
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function SwapsAdminPage() {
  const today = todayStr();
  const [fromDate, setFromDate] = useState(minusDays(today, 30));
  const [toDate, setToDate] = useState(today);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchInput, setSearchInput] = useState("");

  const [wizardOpen, setWizardOpen] = useState(false);
  const [selected, setSelected] = useState(null);

  const { data, isLoading, isFetching, refetch } = useSwapsList({
    from: fromDate,
    to: toDate,
    status: statusFilter === "all" ? undefined : statusFilter,
    limit: 200,
  });

  const deleteMut = useDeleteSwap();

  const swaps = useMemo(() => {
    const list = data?.data || [];
    if (!searchInput.trim()) return list;
    const kw = searchInput.toLowerCase();
    return list.filter(
      (s) =>
        s.original_employee?.employee_code?.toLowerCase().includes(kw) ||
        s.original_employee?.full_name?.toLowerCase().includes(kw) ||
        s.substitute_employee?.employee_code?.toLowerCase().includes(kw) ||
        s.substitute_employee?.full_name?.toLowerCase().includes(kw),
    );
  }, [data, searchInput]);

  const handleDelete = (swap) => {
    if (!confirm(`Xóa bản ghi swap #${swap.id}?`)) return;
    deleteMut.mutate(swap.id);
  };

  return (
    <div className="h-full overflow-y-auto bg-[#EEF2F6]">
      <div className="max-w-[1400px] mx-auto px-6 py-6 space-y-4">
        <PageHeader
          title="Đổi ca đột xuất"
          description="Lịch sử thay đổi ca làm việc và tài xế"
        >
          <Button
            variant="primary"
            onClick={() => setWizardOpen(true)}
            className="bg-[#9333EA] hover:bg-[#7E22CE]"
          >
            <Plus size={14} />
            Tạo swap
          </Button>
        </PageHeader>

        <SwapFilterBar
          fromDate={fromDate}
          toDate={toDate}
          statusFilter={statusFilter}
          searchInput={searchInput}
          onFromDateChange={setFromDate}
          onToDateChange={setToDate}
          onStatusChange={setStatusFilter}
          onSearchChange={setSearchInput}
          onRefresh={refetch}
          isFetching={isFetching}
        />

        <SwapTable
          swaps={swaps}
          isLoading={isLoading}
          onView={setSelected}
          onDelete={handleDelete}
          isDeleting={deleteMut.isPending}
        />

        {swaps.length > 0 && (
          <div className="text-[11px] text-[#8A9AAA] text-center">
            Hiển thị {swaps.length} lượt swap trong khoảng {fromDate} → {toDate}
          </div>
        )}
      </div>

      <SwapDetailDrawer
        swap={selected}
        open={!!selected}
        onClose={() => setSelected(null)}
      />

      <SwapWizardDialog
        open={wizardOpen}
        onClose={() => setWizardOpen(false)}
      />
    </div>
  );
}

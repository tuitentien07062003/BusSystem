import { useState, useEffect, useMemo, useCallback } from 'react';
import { toast } from 'sonner';
import { useStopsList, useChangeStopStatus } from '@/hooks/useStops';
import { StopsStats } from '../components/StopsStats';
import { StopsFilters } from '../components/StopsFilters';
import { StopsTable } from '../components/StopsTable';
import { StopsTableSkeleton } from '../components/StopsTableSkeleton';
import { StopsEmptyState } from '../components/StopsEmptyState';
import { StopsPagination } from '../components/StopsPagination';
import { StopsBulkActions } from '../components/StopsBulkActions';
import { StopEditDialog } from '../components/StopEditDialog';
import { DepotsSection } from '../components/DepotsSection';
import { exportStopsToCsv } from '../utils/exportCsv';

const PAGE_SIZE = 20;

export function StopsAdminPage() {
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [sortBy, setSortBy] = useState('id');
  const [sortOrder, setSortOrder] = useState('asc');

  const [selectedIds, setSelectedIds] = useState(new Set());
  const [editingStop, setEditingStop] = useState(null);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => {
      setKeyword(searchInput);
      setPage(1);
    }, 250);
    return () => clearTimeout(t);
  }, [searchInput]);

  // Reset khi đổi filter
  useEffect(() => {
    setPage(1);
    setSelectedIds(new Set());
  }, [statusFilter]);

  const isActiveParam =
    statusFilter === 'all' ? undefined : statusFilter === 'true';

  // Bảng chính CHỈ lấy trạm dừng (stop_type = 0)
  const { data, isLoading, isFetching, refetch } = useStopsList({
    page,
    limit: PAGE_SIZE,
    keyword,
    is_active: isActiveParam,
    stop_type: 0, // ← CHỈ TRẠM DỪNG
  });

  const rawStops = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;

  const stops = useMemo(() => {
    const list = [...rawStops];
    list.sort((a, b) => {
      const av = a[sortBy];
      const bv = b[sortBy];
      if (av == null) return 1;
      if (bv == null) return -1;
      if (typeof av === 'string') {
        return sortOrder === 'asc'
          ? av.localeCompare(bv, 'vi')
          : bv.localeCompare(av, 'vi');
      }
      return sortOrder === 'asc' ? av - bv : bv - av;
    });
    return list;
  }, [rawStops, sortBy, sortOrder]);

  const handleSort = useCallback(
    (field) => {
      if (sortBy === field) setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'));
      else {
        setSortBy(field);
        setSortOrder('asc');
      }
    },
    [sortBy]
  );

  const toggleSelect = useCallback((id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback(
    (checked) => {
      if (checked) setSelectedIds(new Set(stops.map((s) => s.id)));
      else setSelectedIds(new Set());
    },
    [stops]
  );

  const clearSelection = useCallback(() => setSelectedIds(new Set()), []);

  const statusMutation = useChangeStopStatus();

  const bulkChange = async (is_active) => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    if (ids.length > 20 && !confirm(`Đổi trạng thái ${ids.length} trạm?`)) return;

    toast.promise(
      Promise.all(ids.map((id) => statusMutation.mutateAsync({ id, is_active }))),
      {
        loading: `Đang cập nhật ${ids.length} trạm...`,
        success: `Đã cập nhật ${ids.length} trạm`,
        error: 'Có lỗi khi cập nhật',
      }
    );
    clearSelection();
  };

  const handleExport = () => {
    exportStopsToCsv(stops, `tram-dung-trang-${page}.csv`);
    toast.success(`Đã xuất ${stops.length} trạm ra CSV`);
  };

  const handleResetFilters = () => {
    setSearchInput('');
    setKeyword('');
    setStatusFilter('all');
    setPage(1);
  };

  const hasFilter = keyword.trim() !== '' || statusFilter !== 'all';

  return (
    <div className="h-full overflow-y-auto bg-[#eef2f6]">
      <div className="max-w-[1400px] mx-auto px-6 py-6 space-y-4">
        {/* Header trang */}
        <div>
          <h1 className="text-xl font-bold text-[#1a2332]">
            Quản lý trạm dừng &amp; Depot
          </h1>
          <p className="text-xs text-[#6a7a9a] mt-1">
            Xem, tìm kiếm, chỉnh sửa và quản lý trạng thái các trạm xe buýt và bãi đỗ.
          </p>
        </div>

        <StopsStats />

        {/* ─────────────── BẢNG TRẠM DỪNG (stop_type = 0) ─────────────── */}
        <section className="space-y-3">
          <div className="flex items-center justify-between gap-2 pt-2">
            <div>
              <h2 className="text-base font-bold text-[#1a2332]">
                Danh sách trạm dừng
              </h2>
              <p className="text-[11px] text-[#6a7a9a]">
                Điểm đón / trả khách
              </p>
            </div>
            <div className="text-xs text-[#6a7a9a]">
              Tổng <b className="text-[#1a2332]">{total.toLocaleString('vi-VN')}</b> trạm
            </div>
          </div>

          <StopsFilters
            searchInput={searchInput}
            onSearchChange={setSearchInput}
            statusFilter={statusFilter}
            onStatusChange={setStatusFilter}
            onRefresh={refetch}
            onExport={handleExport}
            canExport={stops.length > 0}
            isFetching={isFetching}
            placeholder="Tìm theo tên trạm...  (nhấn / để focus)"
            enableShortcut={true}
          />

          {isLoading ? (
            <StopsTableSkeleton rows={PAGE_SIZE} />
          ) : stops.length === 0 ? (
            <StopsEmptyState hasFilter={hasFilter} onReset={handleResetFilters} />
          ) : (
            <StopsTable
              stops={stops}
              onEdit={(s) => setEditingStop(s)}
              selectedIds={selectedIds}
              onToggleSelect={toggleSelect}
              onToggleSelectAll={toggleSelectAll}
              sortBy={sortBy}
              sortOrder={sortOrder}
              onSort={handleSort}
              onFocusMap={(s) => setEditingStop(s)}
            />
          )}

          <StopsPagination
            page={page}
            totalPages={totalPages}
            total={total}
            limit={PAGE_SIZE}
            onChange={setPage}
          />
        </section>

        {/* ─────────────── BẢNG DEPOT (stop_type = 1) ─────────────── */}
        <DepotsSection onEdit={(s) => setEditingStop(s)} />
      </div>

      {/* Bulk actions cho bảng trạm dừng */}
      <StopsBulkActions
        count={selectedIds.size}
        onActivate={() => bulkChange(true)}
        onDeactivate={() => bulkChange(false)}
        onClear={clearSelection}
        isLoading={statusMutation.isPending}
      />

      {/* Dialog sửa — dùng chung cho cả 2 bảng */}
      <StopEditDialog
        stop={editingStop}
        open={!!editingStop}
        onOpenChange={(v) => !v && setEditingStop(null)}
      />
    </div>
  );
}

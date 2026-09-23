import { useState, useEffect, useMemo, useCallback } from 'react';
import { toast } from 'sonner';
import { Warehouse, Info } from 'lucide-react';
import { useStopsList, useChangeStopStatus } from '@/hooks/useStops';
import { Badge } from '@/components/ui/badge';
import { StopsTable } from './StopsTable';
import { StopsTableSkeleton } from './StopsTableSkeleton';
import { StopsEmptyState } from './StopsEmptyState';
import { StopsPagination } from './StopsPagination';
import { StopsBulkActions } from './StopsBulkActions';
import { StopsFilters } from './StopsFilters';
import { exportStopsToCsv } from '../utils/exportCsv';

const PAGE_SIZE = 20;

// Bảng riêng cho Depot (stop_type = 1)
export function DepotsSection({ onEdit }) {
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [keyword, setKeyword] = useState('');
  const [sortBy, setSortBy] = useState('id');
  const [sortOrder, setSortOrder] = useState('asc');
  const [selectedIds, setSelectedIds] = useState(new Set());

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => {
      setKeyword(searchInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  const { data, isLoading, isFetching, refetch } = useStopsList({
    page,
    limit: PAGE_SIZE,
    keyword,
    stop_type: 1, // ← CHỈ LẤY DEPOT
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
    toast.promise(
      Promise.all(ids.map((id) => statusMutation.mutateAsync({ id, is_active }))),
      {
        loading: `Đang cập nhật ${ids.length} depot...`,
        success: `Đã cập nhật ${ids.length} depot`,
        error: 'Có lỗi khi cập nhật',
      }
    );
    clearSelection();
  };

  const handleExport = () => {
    exportStopsToCsv(stops, `depots-trang-${page}.csv`);
    toast.success(`Đã xuất ${stops.length} depot ra CSV`);
  };

  const hasFilter = keyword.trim() !== '';

  return (
    <section className="space-y-3">
      {/* Tiêu đề section */}
      <div className="flex items-center justify-between gap-2 border-t-2 border-[#d0d7e2] pt-5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#fdf2e3] flex items-center justify-center">
            <Warehouse size={16} className="text-[#d48c2c]" />
          </div>
          <div>
            <h2 className="text-base font-bold text-[#1a2332] flex items-center gap-2">
              Danh sách Depot
              <Badge variant="warning">stop_type = 1</Badge>
            </h2>
            <p className="text-[11px] text-[#6a7a9a]">
              Bãi đỗ / kho chứa xe buýt
            </p>
          </div>
        </div>
        <div className="text-xs text-[#6a7a9a]">
          Tổng <b className="text-[#1a2332]">{total.toLocaleString('vi-VN')}</b> depot
        </div>
      </div>

      {/* Filters riêng cho depot */}
      <StopsFilters
        searchInput={searchInput}
        onSearchChange={setSearchInput}
        onRefresh={refetch}
        onExport={handleExport}
        canExport={stops.length > 0}
        isFetching={isFetching}
        placeholder="Tìm theo tên depot..."
        enableShortcut={false}
        hideStatusFilter={true}
      />

      {/* Bảng */}
      {isLoading ? (
        <StopsTableSkeleton rows={PAGE_SIZE} />
      ) : stops.length === 0 ? (
        <StopsEmptyState
          hasFilter={hasFilter}
          onReset={() => {
            setSearchInput('');
            setKeyword('');
            setPage(1);
          }}
        />
      ) : (
        <StopsTable
          stops={stops}
          onEdit={onEdit}
          selectedIds={selectedIds}
          onToggleSelect={toggleSelect}
          onToggleSelectAll={toggleSelectAll}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSort={handleSort}
          onFocusMap={onEdit}
          hideTypeColumn={true}
        />
      )}

      {/* Phân trang */}
      <StopsPagination
        page={page}
        totalPages={totalPages}
        total={total}
        limit={PAGE_SIZE}
        onChange={setPage}
      />

      {/* Bulk actions */}
      <StopsBulkActions
        count={selectedIds.size}
        onActivate={() => bulkChange(true)}
        onDeactivate={() => bulkChange(false)}
        onClear={clearSelection}
        isLoading={statusMutation.isPending}
      />
    </section>
  );
}

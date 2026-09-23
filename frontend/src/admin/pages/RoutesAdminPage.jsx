import { useState, useEffect, useMemo } from 'react';
import { Plus, Search, RefreshCw } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { PageHeader } from '../components/PageHeader';
import { RouteStats } from '../components/routes/RouteStats';
import { RoutesTable } from '../components/routes/RoutesTable';
import { RouteComposerDialog } from '../components/routes/RouteComposerDialog';
import { RouteDetailPage } from '../components/routes/RouteDetailPage';
import { useRoutesList } from '@/hooks/useRoutes';

const NUMERIC_COLS = new Set(['id', 'agency_id']);

function compareRows(a, b, col, order) {
  const av = a[col];
  const bv = b[col];
  if (av == null) return 1;
  if (bv == null) return -1;
  if (NUMERIC_COLS.has(col)) {
    return order === 'asc' ? Number(av) - Number(bv) : Number(bv) - Number(av);
  }
  const as = String(av);
  const bs = String(bv);
  return order === 'asc' ? as.localeCompare(bs, 'vi') : bs.localeCompare(as, 'vi');
}

export function RoutesAdminPage() {
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [keyword, setKeyword] = useState('');
  const [sortBy, setSortBy] = useState('id');
  const [sortOrder, setSortOrder] = useState('asc');

  const [editing, setEditing] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedRouteId, setSelectedRouteId] = useState(null);

  useEffect(() => {
    const t = setTimeout(() => {
      setKeyword(searchInput);
      setPage(1);
    }, 250);
    return () => clearTimeout(t);
  }, [searchInput]);

  const { data, isLoading, isFetching, refetch } = useRoutesList({
    page, limit: 20, q: keyword,
  });

  const rawRoutes = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;

  const routes = useMemo(() => {
    const list = [...rawRoutes];
    list.sort((a, b) => compareRows(a, b, sortBy, sortOrder));
    return list;
  }, [rawRoutes, sortBy, sortOrder]);

  const handleSort = (field) => {
    if (sortBy === field) setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'));
    else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  return (
    <div className="h-full relative overflow-hidden">
      {/* Danh sách routes */}
      <div className="h-full overflow-y-auto bg-[#eef2f6]">
        <div className="max-w-[1400px] mx-auto px-6 py-6 space-y-4">
          <PageHeader
            title="Quản lý tuyến đường"
            description="Xem, chỉnh sửa và quản lý lộ trình các tuyến xe buýt."
          >
            <Button
              variant="primary"
              onClick={() => {
                setEditing(null);
                setDialogOpen(true);
              }}
            >
              <Plus size={14} /> Thêm tuyến
            </Button>
          </PageHeader>

          <RouteStats />

          <div className="bg-white rounded-lg border border-[#d0d7e2] p-3 flex gap-2">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8a9aaa]" />
              <Input
                placeholder="Tìm theo mã hoặc tên tuyến..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-8"
              />
            </div>
            <button
              onClick={refetch}
              disabled={isFetching}
              className="h-9 w-9 rounded-md border border-[#cbd5e1] bg-white hover:bg-[#eef2f6] flex items-center justify-center disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw
                size={14}
                className={isFetching ? 'animate-spin text-[#1a5a8a]' : 'text-[#4a5a7a]'}
              />
            </button>
          </div>

          <RoutesTable
            routes={routes}
            isLoading={isLoading}
            onEdit={(r) => {
              setEditing(r);
              setDialogOpen(true);
            }}
            onView={(r) => setSelectedRouteId(r.id)}
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSort={handleSort}
          />

          {totalPages > 1 && (
            <div className="flex items-center justify-between text-xs text-[#6a7a9a]">
              <span>
                Trang <b className="text-[#1a2332]">{page}</b> / {totalPages} · Tổng{' '}
                <b className="text-[#1a2332]">{total.toLocaleString('vi-VN')}</b>
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => p - 1)}
                  disabled={page <= 1}
                  className="h-8 px-3 rounded-md border border-[#cbd5e1] bg-white text-xs font-semibold disabled:opacity-40 cursor-pointer"
                >
                  Trước
                </button>
                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page >= totalPages}
                  className="h-8 px-3 rounded-md border border-[#cbd5e1] bg-white text-xs font-semibold disabled:opacity-40 cursor-pointer"
                >
                  Sau
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Overlay chi tiết route */}
      {selectedRouteId != null && (
        <RouteDetailPage
          routeId={selectedRouteId}
          onBack={() => setSelectedRouteId(null)}
        />
      )}

      {/* Dialog thêm/sửa route */}
      <RouteComposerDialog
        route={editing}
        open={dialogOpen}
        onOpenChange={(v) => {
          setDialogOpen(v);
          if (!v) setEditing(null);
        }}
      />
    </div>
  );
}

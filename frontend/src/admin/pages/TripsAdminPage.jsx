import { useState, useEffect, useMemo } from 'react';
import { Plus, Search, RefreshCw } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { PageHeader } from '../components/PageHeader';
import { TripsTable } from '../components/trips/TripsTable';
import { TripFormDialog } from '../components/trips/TripFormDialog';
import { useTripsList } from '@/hooks/useTrips';

export function TripsAdminPage() {
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [keyword, setKeyword] = useState('');
  const [sortBy, setSortBy] = useState('id');
  const [sortOrder, setSortOrder] = useState('asc');
  const [editing, setEditing] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => { setKeyword(searchInput); setPage(1); }, 250);
    return () => clearTimeout(t);
  }, [searchInput]);

  const { data, isLoading, isFetching, refetch } = useTripsList({ page, limit: 20, q: keyword });
  const rawData = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;

  const trips = useMemo(() => {
    const list = [...rawData];
    list.sort((a, b) => {
      const av = a[sortBy], bv = b[sortBy];
      if (av == null) return 1;
      if (bv == null) return -1;
      if (typeof av === 'string') return sortOrder === 'asc' ? av.localeCompare(bv, 'vi') : bv.localeCompare(av, 'vi');
      return sortOrder === 'asc' ? av - bv : bv - av;
    });
    return list;
  }, [rawData, sortBy, sortOrder]);

  const handleSort = (field) => {
    if (sortBy === field) setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'));
    else { setSortBy(field); setSortOrder('asc'); }
  };

  return (
    <div className="h-full overflow-y-auto bg-[#eef2f6]">
      <div className="max-w-[1400px] mx-auto px-6 py-6 space-y-4">
        <PageHeader title="Chuyến xe" description="Quản lý các chuyến cụ thể theo pattern và lịch phục vụ.">
          <Button variant="primary" onClick={() => { setEditing(null); setDialogOpen(true); }}>
            <Plus size={14} /> Thêm chuyến
          </Button>
        </PageHeader>

        <div className="bg-white rounded-lg border border-[#d0d7e2] p-3 flex gap-2">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8a9aaa]" />
            <Input placeholder="Tìm theo mã chuyến..." value={searchInput} onChange={(e) => setSearchInput(e.target.value)} className="pl-8" />
          </div>
          <button onClick={refetch} disabled={isFetching} className="h-9 w-9 rounded-md border border-[#cbd5e1] bg-white hover:bg-[#eef2f6] flex items-center justify-center disabled:opacity-50 cursor-pointer">
            <RefreshCw size={14} className={isFetching ? 'animate-spin text-[#1a5a8a]' : 'text-[#4a5a7a]'} />
          </button>
        </div>

        <TripsTable trips={trips} isLoading={isLoading} onEdit={(r) => { setEditing(r); setDialogOpen(true); }} sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} />

        {totalPages > 1 && (
          <div className="flex items-center justify-between text-xs text-[#6a7a9a]">
            <span>Trang <b className="text-[#1a2332]">{page}</b> / {totalPages} · Tổng <b className="text-[#1a2332]">{total}</b></span>
            <div className="flex gap-2">
              <button onClick={() => setPage((p) => p - 1)} disabled={page <= 1} className="h-8 px-3 rounded-md border border-[#cbd5e1] bg-white text-xs font-semibold disabled:opacity-40 cursor-pointer">Trước</button>
              <button onClick={() => setPage((p) => p + 1)} disabled={page >= totalPages} className="h-8 px-3 rounded-md border border-[#cbd5e1] bg-white text-xs font-semibold disabled:opacity-40 cursor-pointer">Sau</button>
            </div>
          </div>
        )}

        <TripFormDialog trip={editing} open={dialogOpen} onOpenChange={(v) => { setDialogOpen(v); if (!v) setEditing(null); }} />
      </div>
    </div>
  );
}

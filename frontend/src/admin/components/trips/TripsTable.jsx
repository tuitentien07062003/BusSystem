import { Pencil, Power, PowerOff } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/ui/data-table';
import { useChangeTripStatus } from '@/hooks/useTrips';

export function TripsTable({ trips, isLoading, onEdit, sortBy, sortOrder, onSort }) {
  const statusMut = useChangeTripStatus();

  const columns = [
    { key: 'id', label: 'ID', sortable: true, width: 70,
      render: (r) => <span className="text-[#6a7a9a] font-mono text-xs">{r.id}</span> },
    { key: 'trip_id', label: 'Mã chuyến', sortable: true,
      render: (r) => <span className="font-mono text-xs text-[#1a5a8a] font-semibold">{r.trip_id}</span> },
    { key: 'trip_pattern_id', label: 'Pattern ID', width: 100,
      render: (r) => <span className="text-xs text-[#4a5a7a] font-mono">{r.trip_pattern_id ?? '—'}</span> },
    { key: 'service_id', label: 'Service ID', width: 100,
      render: (r) => <span className="text-xs text-[#4a5a7a] font-mono">{r.service_id ?? '—'}</span> },
    { key: 'start_time', label: 'Giờ xuất bến',
      render: (r) => <span className="text-xs font-mono text-[#1a2332] font-semibold">{r.start_time}</span> },
    { key: 'is_active', label: 'Trạng thái', align: 'center', width: 110,
      render: (r) => r.is_active ? <Badge variant="success">Hoạt động</Badge> : <Badge variant="danger">Ngưng</Badge> },
    { key: 'actions', label: 'Hành động', align: 'center', width: 100,
      render: (r) => (
        <div className="flex items-center justify-center gap-1">
          <button onClick={() => onEdit(r)} className="h-7 w-7 rounded-md border border-[#cbd5e1] bg-white hover:bg-[#eef2f6] flex items-center justify-center cursor-pointer">
            <Pencil size={12} className="text-[#1a5a8a]" />
          </button>
          <button
            onClick={() => statusMut.mutate({ id: r.id, is_active: !r.is_active })}
            disabled={statusMut.isPending}
            className={`h-7 w-7 rounded-md border flex items-center justify-center cursor-pointer disabled:opacity-50 ${
              r.is_active ? 'border-[#f5b7b1] bg-white hover:bg-[#fde8e8]' : 'border-[#b8d4b0] bg-white hover:bg-[#dce8de]'
            }`}
          >
            {r.is_active ? <PowerOff size={12} className="text-[#c0392b]" /> : <Power size={12} className="text-[#2e7d5a]" />}
          </button>
        </div>
      ) },
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
    />
  );
}

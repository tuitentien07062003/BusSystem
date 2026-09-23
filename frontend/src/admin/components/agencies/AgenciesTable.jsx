import { Pencil, Power, PowerOff } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/ui/data-table';
import { useChangeAgencyStatus } from '@/hooks/useAgencies';

function formatDate(s) {
  if (!s) return '—';
  try {
    return new Date(s).toLocaleDateString('vi-VN');
  } catch {
    return '—';
  }
}

export function AgenciesTable({ agencies, isLoading, onEdit, sortBy, sortOrder, onSort }) {
  const statusMut = useChangeAgencyStatus();

  const columns = [
    { key: 'id', label: 'ID', sortable: true, width: 60,
      render: (r) => <span className="text-[#6a7a9a] font-mono text-xs">{r.id}</span> },
    { key: 'agency_id', label: 'Mã', sortable: true, width: 100,
      render: (r) => <span className="font-mono text-xs text-[#1a5a8a] font-semibold">{r.agency_id}</span> },
    { key: 'agency_name', label: 'Tên nhà vận hành', sortable: true,
      render: (r) => <span className="font-medium text-[#1a2332]">{r.agency_name}</span> },
    { key: 'agency_url', label: 'Website',
      render: (r) =>
        r.agency_url ? (
          <a href={r.agency_url} target="_blank" rel="noreferrer" className="text-xs text-[#1a5a8a] hover:underline truncate block max-w-[220px]">
            {r.agency_url}
          </a>
        ) : <span className="text-[#8a9aaa] text-xs">—</span> },
    { key: 'agency_timezone', label: 'Múi giờ',
      render: (r) => <span className="text-xs text-[#4a5a7a] font-mono">{r.agency_timezone || '—'}</span> },
    { key: 'created_at', label: 'Ngày tạo', sortable: true,
      render: (r) => <span className="text-xs text-[#6a7a9a]">{formatDate(r.created_at)}</span> },
    { key: 'is_active', label: 'Trạng thái', align: 'center', width: 110,
      render: (r) => r.is_active ? <Badge variant="success">Hoạt động</Badge> : <Badge variant="danger">Ngưng</Badge> },
    { key: 'actions', label: 'Hành động', align: 'center', width: 100,
      render: (r) => (
        <div className="flex items-center justify-center gap-1">
          <button onClick={() => onEdit(r)} title="Sửa" className="h-7 w-7 rounded-md border border-[#cbd5e1] bg-white hover:bg-[#eef2f6] flex items-center justify-center cursor-pointer">
            <Pencil size={12} className="text-[#1a5a8a]" />
          </button>
          <button
            onClick={() => statusMut.mutate({ id: r.id, is_active: !r.is_active })}
            disabled={statusMut.isPending}
            title={r.is_active ? 'Ngưng' : 'Kích hoạt'}
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
      rows={agencies}
      isLoading={isLoading}
      emptyMessage="Chưa có nhà vận hành nào"
      sortBy={sortBy}
      sortOrder={sortOrder}
      onSort={onSort}
    />
  );
}

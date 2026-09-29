import { Pencil, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/ui/data-table';
import { useDeleteCalendar } from '@/hooks/useServiceCalendars';

const DAY_LABELS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
const DAY_KEYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

export function CalendarsTable({ calendars, isLoading, onEdit, sortBy, sortOrder, onSort }) {
  const deleteMut = useDeleteCalendar();

  const columns = [
    { key: 'id', label: 'ID', sortable: true, width: 60,
      render: (r) => <span className="text-[#6a7a9a] font-mono text-xs">{r.id}</span> },
    { key: 'service_id', label: 'Mã lịch', sortable: true,
      render: (r) => <span className="font-mono text-xs text-[#169BA2] font-semibold">{r.service_id}</span> },
    { key: 'days', label: 'Ngày chạy',
      render: (r) => (
        <div className="flex gap-0.5">
          {DAY_KEYS.map((k, i) => (
            <span key={k} className={`text-[10px] w-6 h-6 rounded flex items-center justify-center font-bold ${
              r[k] ? 'bg-[#E6F4F5] text-[#169BA2]' : 'bg-[#eef2f6] text-[#b0bcca]'
            }`}>
              {DAY_LABELS[i]}
            </span>
          ))}
        </div>
      ) },
    { key: 'start_date', label: 'Bắt đầu',
      render: (r) => <span className="text-xs text-[#4a5a7a]">{r.start_date}</span> },
    { key: 'end_date', label: 'Kết thúc',
      render: (r) => <span className="text-xs text-[#4a5a7a]">{r.end_date}</span> },
    { key: 'actions', label: 'Hành động', align: 'center', width: 100,
      render: (r) => (
        <div className="flex items-center justify-center gap-1">
          <button onClick={() => onEdit(r)} className="h-7 w-7 rounded-md border border-[#cbd5e1] bg-white hover:bg-[#eef2f6] flex items-center justify-center cursor-pointer">
            <Pencil size={12} className="text-[#169BA2]" />
          </button>
          <button
            onClick={() => { if (confirm(`Xóa lịch "${r.service_id}"?`)) deleteMut.mutate(r.id); }}
            disabled={deleteMut.isPending}
            className="h-7 w-7 rounded-md border border-[#f5b7b1] bg-white hover:bg-[#fde8e8] flex items-center justify-center cursor-pointer disabled:opacity-50"
          >
            <Trash2 size={12} className="text-[#c0392b]" />
          </button>
        </div>
      ) },
  ];

  return (
    <DataTable
      columns={columns}
      rows={calendars}
      isLoading={isLoading}
      emptyMessage="Chưa có lịch phục vụ nào"
      sortBy={sortBy}
      sortOrder={sortOrder}
      onSort={onSort}
    />
  );
}

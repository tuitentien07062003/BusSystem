import { Pencil, Power, PowerOff, Trash2, Eye } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/ui/data-table';
import { useChangeRouteStatus, useDeleteComposedRoute } from '@/hooks/useRoutes';

export function RoutesTable({
  routes,
  isLoading,
  onEdit,
  onView,
  sortBy,
  sortOrder,
  onSort,
}) {
  const statusMut = useChangeRouteStatus();
  const deleteMut = useDeleteComposedRoute();

  const columns = [
    {
      key: 'id',
      label: 'ID',
      sortable: true,
      width: 60,
      render: (r) => <span className="text-[#6a7a9a] font-mono text-xs">{r.id}</span>,
    },
    {
      key: 'route_id',
      label: 'Mã tuyến',
      sortable: true,
      width: 110,
      render: (r) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onView?.(r);
          }}
          className="font-mono text-xs text-[#1a5a8a] font-semibold hover:underline cursor-pointer"
        >
          {r.route_id}
        </button>
      ),
    },
    {
      key: 'route_short_name',
      label: 'Tên ngắn',
      sortable: true,
      width: 130,
      render: (r) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onView?.(r);
          }}
          className="font-medium text-[#1a2332] hover:text-[#1a5a8a] hover:underline cursor-pointer text-left"
        >
          {r.route_short_name}
        </button>
      ),
    },
    {
      key: 'route_full_name',
      label: 'Tên đầy đủ',
      render: (r) => (
        <span
          className="text-xs text-[#4a5a7a] truncate block max-w-[280px]"
          title={r.route_full_name}
        >
          {r.route_full_name}
        </span>
      ),
    },
    {
      key: 'route_color',
      label: 'Màu',
      width: 70,
      align: 'center',
      render: (r) => (
        <div className="flex items-center justify-center">
          <span
            className="w-5 h-5 rounded border border-[#d0d7e2]"
            style={{ background: r.route_color || '#ccc' }}
          />
        </div>
      ),
    },
    {
      key: 'is_active',
      label: 'Trạng thái',
      align: 'center',
      width: 110,
      render: (r) =>
        r.is_active ? (
          <Badge variant="success">Hoạt động</Badge>
        ) : (
          <Badge variant="danger">Ngưng</Badge>
        ),
    },
    {
      key: 'actions',
      label: 'Hành động',
      align: 'center',
      width: 140,
      render: (r) => (
        <div className="flex items-center justify-center gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onView?.(r);
            }}
            title="Xem chi tiết"
            className="h-7 w-7 rounded-md border border-[#cbd5e1] bg-white hover:bg-[#eef2f6] flex items-center justify-center cursor-pointer"
          >
            <Eye size={12} className="text-[#4a5a7a]" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(r);
            }}
            title="Sửa"
            className="h-7 w-7 rounded-md border border-[#cbd5e1] bg-white hover:bg-[#eef2f6] flex items-center justify-center cursor-pointer"
          >
            <Pencil size={12} className="text-[#1a5a8a]" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              statusMut.mutate({ id: r.id, is_active: !r.is_active });
            }}
            disabled={statusMut.isPending}
            title={r.is_active ? 'Ngưng' : 'Kích hoạt'}
            className={`h-7 w-7 rounded-md border flex items-center justify-center cursor-pointer disabled:opacity-50 ${
              r.is_active
                ? 'border-[#f5b7b1] bg-white hover:bg-[#fde8e8]'
                : 'border-[#b8d4b0] bg-white hover:bg-[#dce8de]'
            }`}
          >
            {r.is_active ? (
              <PowerOff size={12} className="text-[#c0392b]" />
            ) : (
              <Power size={12} className="text-[#2e7d5a]" />
            )}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (confirm(`Xoá tuyến "${r.route_id}" và toàn bộ patterns, shapes, trips liên quan?`)) {
                deleteMut.mutate(r.id);
              }
            }}
            disabled={deleteMut.isPending}
            title="Xoá"
            className="h-7 w-7 rounded-md border border-[#f5b7b1] bg-white hover:bg-[#fde8e8] flex items-center justify-center cursor-pointer disabled:opacity-50"
          >
            <Trash2 size={12} className="text-[#c0392b]" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      rows={routes}
      isLoading={isLoading}
      emptyMessage="Chưa có tuyến nào"
      sortBy={sortBy}
      sortOrder={sortOrder}
      onSort={onSort}
      rowKey="id"
      onRowClick={(r) => onView?.(r)}
    />
  );
}

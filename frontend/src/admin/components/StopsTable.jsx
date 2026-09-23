import {
  Pencil,
  Power,
  PowerOff,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  MapPin,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { useChangeStopStatus } from '@/hooks/useStops';

function formatDate(s) {
  if (!s) return '—';
  try {
    return new Date(s).toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '—';
  }
}

function formatCoord(lat, lng) {
  if (lat == null || lng == null) return '—';
  return `${Number(lat).toFixed(5)}, ${Number(lng).toFixed(5)}`;
}

function SortHeader({ label, field, sortBy, sortOrder, onSort, className = '' }) {
  const isActive = sortBy === field;
  const Icon = !isActive ? ArrowUpDown : sortOrder === 'asc' ? ArrowUp : ArrowDown;

  return (
    <th
      className={`text-left px-3 py-2.5 text-[11px] font-bold uppercase tracking-wide text-[#6a7a9a] ${className}`}
    >
      <button
        onClick={() => onSort(field)}
        className={`inline-flex items-center gap-1 hover:text-[#1a5a8a] cursor-pointer transition-colors ${
          isActive ? 'text-[#1a5a8a]' : ''
        }`}
      >
        {label}
        <Icon size={12} className={isActive ? 'opacity-100' : 'opacity-40'} />
      </button>
    </th>
  );
}

export function StopsTable({
  stops,
  onEdit,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  sortBy,
  sortOrder,
  onSort,
  onFocusMap,
  hideTypeColumn = false,   // ← Ẩn cột "Loại" khi hiển thị bảng Depot
}) {
  const statusMutation = useChangeStopStatus();

  const handleToggleStatus = (stop) => {
    statusMutation.mutate({ id: stop.id, is_active: !stop.is_active });
  };

  if (!stops?.length) return null;

  const allSelected = stops.length > 0 && stops.every((s) => selectedIds.has(s.id));
  const someSelected = stops.some((s) => selectedIds.has(s.id));

  return (
    <div className="bg-white rounded-lg border border-[#d0d7e2] overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[#f8fafc] border-b border-[#e5eaf0]">
              <th className="w-10 px-3 py-2.5">
                <Checkbox
                  checked={allSelected ? true : someSelected ? 'indeterminate' : false}
                  onCheckedChange={(v) => onToggleSelectAll(!!v)}
                  aria-label="Chọn tất cả"
                />
              </th>

              <SortHeader
                label="ID"
                field="id"
                sortBy={sortBy}
                sortOrder={sortOrder}
                onSort={onSort}
                className="w-16"
              />
              <SortHeader
                label="Mã"
                field="stop_id"
                sortBy={sortBy}
                sortOrder={sortOrder}
                onSort={onSort}
                className="w-24"
              />
              <SortHeader
                label="Tên"
                field="stop_name"
                sortBy={sortBy}
                sortOrder={sortOrder}
                onSort={onSort}
              />
              {!hideTypeColumn && (
                <SortHeader
                  label="Loại"
                  field="stop_type"
                  sortBy={sortBy}
                  sortOrder={sortOrder}
                  onSort={onSort}
                  className="w-24"
                />
              )}
              <th className="text-left px-3 py-2.5 text-[11px] font-bold uppercase tracking-wide text-[#6a7a9a] w-48">
                Toạ độ
              </th>
              <SortHeader
                label="Ngày tạo"
                field="created_at"
                sortBy={sortBy}
                sortOrder={sortOrder}
                onSort={onSort}
                className="w-36"
              />
              <th className="text-center px-3 py-2.5 text-[11px] font-bold uppercase tracking-wide text-[#6a7a9a] w-28">
                Trạng thái
              </th>
              <th className="text-center px-3 py-2.5 text-[11px] font-bold uppercase tracking-wide text-[#6a7a9a] w-28">
                Hành động
              </th>
            </tr>
          </thead>
          <tbody>
            {stops.map((s) => {
              const isSelected = selectedIds.has(s.id);
              return (
                <tr
                  key={s.id}
                  className={`border-b border-[#eef2f6] last:border-0 transition-colors ${
                    isSelected ? 'bg-[#f0f7fc]' : 'hover:bg-[#f8fafc]'
                  }`}
                >
                  <td className="px-3 py-2.5">
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => onToggleSelect(s.id)}
                      aria-label={`Chọn ${s.stop_id}`}
                    />
                  </td>

                  <td className="px-3 py-2.5 text-[#6a7a9a] font-mono text-xs">
                    {s.id}
                  </td>
                  <td className="px-3 py-2.5 font-mono text-xs text-[#1a5a8a] font-semibold">
                    {s.stop_id}
                  </td>
                  <td
                    className="px-3 py-2.5 font-medium text-[#1a2332] max-w-[280px] truncate"
                    title={s.stop_name}
                  >
                    {s.stop_name}
                  </td>

                  {!hideTypeColumn && (
                    <td className="px-3 py-2.5">
                      {s.stop_type === 1 ? (
                        <Badge variant="warning">Depot</Badge>
                      ) : (
                        <Badge variant="muted">Trạm dừng</Badge>
                      )}
                    </td>
                  )}

                  <td className="px-3 py-2.5 text-xs text-[#4a5a7a] font-mono">
                    <div className="flex items-center gap-1.5">
                      <span>{formatCoord(s.latitude, s.longitude)}</span>
                      {s.latitude != null && (
                        <button
                          onClick={() => onFocusMap(s)}
                          title="Xem trên bản đồ"
                          className="w-5 h-5 rounded flex items-center justify-center text-[#8a9aaa] hover:bg-[#eef2f6] hover:text-[#1a5a8a] cursor-pointer shrink-0"
                        >
                          <MapPin size={11} />
                        </button>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-xs text-[#6a7a9a]">
                    {formatDate(s.created_at)}
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    {s.is_active ? (
                      <Badge variant="success">Hoạt động</Badge>
                    ) : (
                      <Badge variant="danger">Ngưng</Badge>
                    )}
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => onEdit(s)}
                        title="Sửa thông tin"
                        className="h-7 w-7 rounded-md border border-[#cbd5e1] bg-white hover:bg-[#eef2f6] flex items-center justify-center cursor-pointer"
                      >
                        <Pencil size={12} className="text-[#1a5a8a]" />
                      </button>
                      <button
                        onClick={() => handleToggleStatus(s)}
                        disabled={statusMutation.isPending}
                        title={s.is_active ? 'Ngưng hoạt động' : 'Kích hoạt'}
                        className={`h-7 w-7 rounded-md border flex items-center justify-center cursor-pointer disabled:opacity-50 ${
                          s.is_active
                            ? 'border-[#f5b7b1] bg-white hover:bg-[#fde8e8]'
                            : 'border-[#b8d4b0] bg-white hover:bg-[#dce8de]'
                        }`}
                      >
                        {s.is_active ? (
                          <PowerOff size={12} className="text-[#c0392b]" />
                        ) : (
                          <Power size={12} className="text-[#2e7d5a]" />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

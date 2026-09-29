import { ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';

export function DataTable({
  columns,
  rows,
  isLoading,
  emptyMessage = 'Không có dữ liệu',
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  sortBy,
  sortOrder,
  onSort,
  rowKey = 'id',
  onRowClick,
}) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-[#d0d7e2] p-12 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#169BA2] border-t-transparent mx-auto mb-3" />
        <p className="text-sm text-[#6a7a9a]">Đang tải...</p>
      </div>
    );
  }

  if (!rows?.length) {
    return (
      <div className="bg-white rounded-lg border border-dashed border-[#d0d7e2] py-16 px-6 text-center">
        <p className="text-sm text-[#6a7a9a]">{emptyMessage}</p>
      </div>
    );
  }

  const allSelected =
    selectedIds && rows.length > 0 && rows.every((r) => selectedIds.has(r[rowKey]));
  const someSelected = selectedIds && rows.some((r) => selectedIds.has(r[rowKey]));

  const showCheckbox = !!onToggleSelect;
  const isClickable = !!onRowClick;

  return (
    <div className="bg-white rounded-lg border border-[#d0d7e2] overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[#f8fafc] border-b border-[#e5eaf0]">
              {showCheckbox && (
                <th className="w-10 px-3 py-2.5">
                  <Checkbox
                    checked={allSelected ? true : someSelected ? 'indeterminate' : false}
                    onCheckedChange={(v) => onToggleSelectAll?.(!!v)}
                  />
                </th>
              )}
              {columns.map((col) => {
                const isActive = sortBy === col.key;
                const Icon = !isActive
                  ? ArrowUpDown
                  : sortOrder === 'asc'
                  ? ArrowUp
                  : ArrowDown;
                return (
                  <th
                    key={col.key}
                    style={col.width ? { width: col.width } : undefined}
                    className={`px-3 py-2.5 text-[11px] font-bold uppercase tracking-wide text-[#6a7a9a] ${
                      col.align === 'center'
                        ? 'text-center'
                        : col.align === 'right'
                        ? 'text-right'
                        : 'text-left'
                    }`}
                  >
                    {col.sortable ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSort?.(col.key);
                        }}
                        className={`inline-flex items-center gap-1 hover:text-[#169BA2] cursor-pointer ${
                          isActive ? 'text-[#169BA2]' : ''
                        }`}
                      >
                        {col.label}
                        <Icon size={12} className={isActive ? 'opacity-100' : 'opacity-40'} />
                      </button>
                    ) : (
                      col.label
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const isSelected = selectedIds?.has(row[rowKey]);
              return (
                <tr
                  key={row[rowKey]}
                  onClick={isClickable ? () => onRowClick(row) : undefined}
                  className={`border-b border-[#eef2f6] last:border-0 transition-colors ${
                    isSelected ? 'bg-[#f0f7fc]' : 'hover:bg-[#f8fafc]'
                  } ${isClickable ? 'cursor-pointer' : ''}`}
                >
                  {showCheckbox && (
                    <td className="px-3 py-2.5" onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => onToggleSelect?.(row[rowKey])}
                      />
                    </td>
                  )}
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={`px-3 py-2.5 ${
                        col.align === 'center'
                          ? 'text-center'
                          : col.align === 'right'
                          ? 'text-right'
                          : 'text-left'
                      }`}
                    >
                      {col.render ? col.render(row) : row[col.key]}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

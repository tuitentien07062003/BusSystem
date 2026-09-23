// Xuất danh sách stops ra file CSV (Excel đọc được UTF-8 nhờ BOM)
export function exportStopsToCsv(stops, filename = 'danh-sach-tram.csv') {
  if (!stops?.length) return;

  const headers = [
    'ID',
    'Mã trạm',
    'Tên trạm',
    'Loại',
    'Vĩ độ',
    'Kinh độ',
    'Trạng thái',
    'Ngày tạo',
  ];

  const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;

  const rows = stops.map((s) => [
    s.id,
    s.stop_id,
    s.stop_name,
    s.stop_type === 1 ? 'Bến' : 'Trạm',
    s.latitude ?? '',
    s.longitude ?? '',
    s.is_active ? 'Hoạt động' : 'Ngưng',
    s.created_at ? new Date(s.created_at).toLocaleString('vi-VN') : '',
  ]);

  const csv =
    '\uFEFF' +
    [headers.map(esc).join(','), ...rows.map((r) => r.map(esc).join(','))].join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

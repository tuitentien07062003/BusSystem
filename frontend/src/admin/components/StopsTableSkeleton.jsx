// Skeleton loading shimmer cho bảng
export function StopsTableSkeleton({ rows = 10 }) {
  return (
    <div className="bg-white rounded-lg border border-[#d0d7e2] overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[#f8fafc] border-b border-[#e5eaf0]">
              {[
                'ID',
                'Mã trạm',
                'Tên trạm',
                'Loại',
                'Toạ độ',
                'Ngày tạo',
                'Trạng thái',
                'Hành động',
              ].map((h) => (
                <th
                  key={h}
                  className="text-left px-3 py-2.5 text-[11px] font-bold uppercase tracking-wide text-[#6a7a9a]"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: rows }).map((_, i) => (
              <tr key={i} className="border-b border-[#eef2f6] last:border-0">
                {Array.from({ length: 8 }).map((__, j) => (
                  <td key={j} className="px-3 py-3">
                    <div
                      className="h-3 rounded bg-gradient-to-r from-[#eef2f6] via-[#e2e8f0] to-[#eef2f6] bg-[length:200%_100%] animate-shimmer"
                      style={{ width: `${60 + ((i + j) % 4) * 10}%` }}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <style>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        .animate-shimmer { animation: shimmer 1.4s ease-in-out infinite; }
      `}</style>
    </div>
  );
}

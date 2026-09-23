import { Activity, Ban, ListChecks, TrendingUp } from 'lucide-react';
import { useStopStats } from '@/hooks/useStops';

export function StopsStats() {
  const { data, isLoading } = useStopStats();

  const total = data?.total ?? 0;
  const active = data?.active ?? 0;
  const inactive = data?.inactive ?? 0;
  const activePercent = total > 0 ? (active / total) * 100 : 0;

  const items = [
    {
      key: 'total',
      label: 'Tổng số trạm',
      value: total,
      icon: ListChecks,
      color: 'text-[#1a5a8a] bg-[#dce8f0]',
      accent: 'bg-[#1a5a8a]',
    },
    {
      key: 'active',
      label: 'Đang hoạt động',
      value: active,
      icon: Activity,
      color: 'text-[#2e7d5a] bg-[#dce8de]',
      accent: 'bg-[#2e7d5a]',
    },
    {
      key: 'inactive',
      label: 'Ngưng hoạt động',
      value: inactive,
      icon: Ban,
      color: 'text-[#c0392b] bg-[#fde8e8]',
      accent: 'bg-[#c0392b]',
    },
  ];

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {items.map(({ key, label, value, icon: Icon, color, accent }) => (
          <div
            key={key}
            className="relative bg-white rounded-lg border border-[#d0d7e2] p-4 flex items-center gap-3 transition-all hover:border-[#5fc3e4] hover:shadow-md overflow-hidden group"
          >
            <div
              className={`absolute left-0 top-0 bottom-0 w-1 ${accent} opacity-70 group-hover:opacity-100 transition-opacity`}
            />
            <div
              className={`w-10 h-10 rounded-lg flex items-center justify-center ${color} shrink-0`}
            >
              <Icon size={18} />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] text-[#6a7a9a] uppercase tracking-wide truncate">
                {label}
              </div>
              <div className="text-2xl font-bold text-[#1a2332] leading-tight">
                {isLoading ? '—' : value.toLocaleString('vi-VN')}
              </div>
            </div>
          </div>
        ))}
      </div>

      {!isLoading && total > 0 && (
        <div className="bg-white rounded-lg border border-[#d0d7e2] px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <TrendingUp size={13} className="text-[#2e7d5a]" />
              <span className="text-[11px] font-semibold text-[#4a5a7a] uppercase tracking-wide">
                Tỷ lệ trạm đang hoạt động
              </span>
            </div>
            <span className="text-xs font-bold text-[#2e7d5a]">
              {activePercent.toFixed(1)}%
            </span>
          </div>
          <div className="h-1.5 w-full bg-[#eef2f6] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#2e7d5a] to-[#4caf50] rounded-full transition-all duration-500"
              style={{ width: `${activePercent}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

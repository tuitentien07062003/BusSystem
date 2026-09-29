import { Route as RouteIcon, CheckCircle2, XCircle } from 'lucide-react';
import { useRouteStats } from '@/hooks/useRoutes';

export function RouteStats() {
  const { data, isLoading } = useRouteStats();
  const items = [
    { key: 'total', label: 'Tổng số tuyến', value: data?.total, icon: RouteIcon, color: 'text-[#169BA2] bg-[#E6F4F5]' },
    { key: 'active', label: 'Đang hoạt động', value: data?.active, icon: CheckCircle2, color: 'text-[#169BA2] bg-[#E6F4F5]' },
    { key: 'inactive', label: 'Ngưng hoạt động', value: data?.inactive, icon: XCircle, color: 'text-[#c0392b] bg-[#fde8e8]' },
  ];
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      {items.map(({ key, label, value, icon: Icon, color }) => (
        <div key={key} className="bg-white rounded-lg border border-[#d0d7e2] p-4 flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
            <Icon size={18} />
          </div>
          <div>
            <div className="text-[11px] text-[#6a7a9a] uppercase tracking-wide">{label}</div>
            <div className="text-2xl font-bold text-[#1a2332] leading-tight">
              {isLoading ? '—' : (value ?? 0).toLocaleString('vi-VN')}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

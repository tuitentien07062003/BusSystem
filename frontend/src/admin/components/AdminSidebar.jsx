import { NavLink, Link } from 'react-router-dom';
import {
  MapPin, Bus, ChevronRight, Building2, Route as RouteIcon,
  CalendarDays, Clock,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV_GROUPS = [
  {
    title: 'Quản lý',
    items: [
      { to: '/admin/stops', label: 'Trạm dừng & Depot', icon: MapPin, end: true },
      { to: '/admin/routes', label: 'Tuyến đường', icon: RouteIcon },
      { to: '/admin/trips', label: 'Chuyến xe', icon: Clock },
      { to: '/admin/calendars', label: 'Lịch phục vụ', icon: CalendarDays },
      { to: '/admin/agencies', label: 'Nhà vận hành', icon: Building2 },
    ],
  },
  {
    title: 'Khác',
    items: [{ to: '/', label: 'Xem mô phỏng', icon: Bus, external: true }],
  },
];

export function AdminSidebar() {
  return (
    <aside className="w-[240px] flex-shrink-0 h-screen flex flex-col bg-white border-r border-[#d0d7e2] z-50">
      <div className="px-5 py-5 border-b border-[#eef2f6]">
        <Link to="/admin/stops" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#1a5a8a] to-[#2e7d5a] flex items-center justify-center text-white shadow-sm group-hover:shadow-md transition-shadow">
            <Bus size={18} />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-bold text-[#1a2332] leading-tight">BusSystem</div>
            <div className="text-[10px] text-[#8a9aaa] uppercase tracking-wide">
              Bảng điều khiển
            </div>
          </div>
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5 scrollbar-thin">
        {NAV_GROUPS.map((group) => (
          <div key={group.title}>
            <div className="px-2 mb-1.5 text-[10px] font-bold uppercase tracking-wider text-[#8a9aaa]">
              {group.title}
            </div>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                if (item.external) {
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      className="flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm font-medium text-[#4a5a7a] hover:bg-[#eef2f6] hover:text-[#1a2332] transition-colors group"
                    >
                      <Icon size={15} className="text-[#8a9aaa] group-hover:text-[#1a5a8a]" />
                      <span className="flex-1">{item.label}</span>
                      <ChevronRight size={13} className="text-[#cbd5e1] group-hover:text-[#8a9aaa]" />
                    </Link>
                  );
                }
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    className={({ isActive }) =>
                      cn(
                        'relative flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm transition-colors',
                        isActive
                          ? 'bg-[#dce8f0] text-[#1a5a8a] font-semibold'
                          : 'text-[#4a5a7a] font-medium hover:bg-[#eef2f6] hover:text-[#1a2332]'
                      )
                    }
                  >
                    {({ isActive }) => (
                      <>
                        {isActive && (
                          <span className="absolute left-0 top-2 bottom-2 w-0.5 rounded-r bg-[#1a5a8a]" />
                        )}
                        <Icon size={15} className={isActive ? 'text-[#1a5a8a]' : 'text-[#8a9aaa]'} />
                        <span className="flex-1">{item.label}</span>
                      </>
                    )}
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="px-5 py-3 border-t border-[#eef2f6] flex items-center justify-between">
        <span className="text-[10px] text-[#8a9aaa]">
          Phiên bản <span className="font-mono text-[#4a5a7a]">v1.3.0</span>
        </span>
        <span className="w-1.5 h-1.5 rounded-full bg-[#2e7d5a] animate-pulse" />
      </div>
    </aside>
  );
}

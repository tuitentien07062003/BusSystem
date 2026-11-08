// src/admin/components/AdminSidebar.jsx
import { NavLink, Link, useNavigate } from "react-router-dom";
import {
  MapPin,
  Bus,
  ChevronRight,
  Route as RouteIcon,
  CalendarDays,
  Clock,
  Settings,
  UserCog,
  ClipboardList,
  ArrowRightLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Menu chính ───
const NAV_GROUPS = [
  {
    title: "Quản lý",
    items: [
      {
        to: "/admin/stops",
        label: "Trạm dừng & Depot",
        icon: MapPin,
        end: true,
      },
      { to: "/admin/routes", label: "Tuyến đường", icon: RouteIcon },
      { to: "/admin/trips", label: "Chuyến xe", icon: Clock },
      { to: "/admin/calendars", label: "Lịch phục vụ", icon: CalendarDays },
    ],
  },
  {
    title: "Đội xe & Nhân sự",
    items: [
      { to: "/admin/employees", label: "Nhân viên", icon: UserCog },
      { to: "/admin/vehicles", label: "Xe", icon: Bus },
      { to: "/admin/rosters", label: "Lịch làm việc", icon: CalendarDays },
      { to: "/admin/assignments", label: "Phân công", icon: ClipboardList },

      { to: "/admin/swaps", label: "Đổi ca", icon: ArrowRightLeft },
    ],
  },
  {
    title: "Khác",
    items: [{ to: "/", label: "Xem mô phỏng", icon: Bus, external: true }],
  },
];

export function AdminSidebar() {
  const navigate = useNavigate();

  return (
    <aside className="w-[260px] flex-shrink-0 h-screen flex flex-col bg-white border-r border-[#E5EAF0] z-50">
      {/* ═══════════ BRAND HEADER ═══════════ */}
      <div className="px-5 pt-5 pb-4 border-b border-[#E5EAF0]">
        <Link
          to="/admin/stops"
          className="flex items-center gap-3 group"
          title="TBus — Hệ thống quản lý tuyến"
        >
          <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center">
            <img
              src="/logo/tbus-logo.svg"
              alt="TBus"
              className="w-10 h-10 object-contain"
            />
          </div>
          <div className="min-w-0">
            <div className="text-[15px] font-bold text-[#1A2332] leading-tight tracking-tight">
              TBus
            </div>
            <div className="text-[10px] text-[#6A7A9A] uppercase tracking-[0.08em] font-medium leading-tight mt-0.5">
              Quản lý vận hành
            </div>
          </div>
        </Link>
      </div>

      {/* ═══════════ NAV ═══════════ */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5 scrollbar-thin">
        {NAV_GROUPS.map((group) => (
          <div key={group.title}>
            <div className="px-3 mb-2 text-[10px] font-bold uppercase tracking-[0.1em] text-[#8A9AAA]">
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
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium text-[#38445A] hover:bg-[#F8FAFC] hover:text-[#169BA2] transition-colors group"
                    >
                      <Icon
                        size={16}
                        className="text-[#8A9AAA] group-hover:text-[#169BA2] transition-colors flex-shrink-0"
                      />
                      <span className="flex-1">{item.label}</span>
                      <ChevronRight
                        size={13}
                        className="text-[#C2C8D4] group-hover:text-[#8A9AAA] transition-colors"
                      />
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
                        "relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] transition-colors",
                        isActive
                          ? "bg-[#E6F4F5] text-[#169BA2] font-semibold"
                          : "text-[#38445A] font-medium hover:bg-[#F8FAFC] hover:text-[#169BA2]",
                      )
                    }
                  >
                    {({ isActive }) => (
                      <>
                        {/* Accent bar */}
                        {isActive && (
                          <span className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r-full bg-[#169BA2]" />
                        )}
                        <Icon
                          size={16}
                          className={cn(
                            "flex-shrink-0 transition-colors",
                            isActive ? "text-[#169BA2]" : "text-[#8A9AAA]",
                          )}
                        />
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

      {/* ═══════════ BOTTOM — TBus Profile Block ═══════════ */}
      <div className="flex-shrink-0 border-t border-[#E5EAF0]">
        <button
          onClick={() => navigate("/admin/organization")}
          className="w-full px-4 py-4 flex items-center gap-3 hover:bg-[#F8FAFC] transition-colors group text-left"
        >
          <div className="w-9 h-9 flex-shrink-0 rounded-lg bg-[#169BA2] flex items-center justify-center text-white shadow-sm">
            <Bus size={16} strokeWidth={2.4} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[12px] font-bold text-[#1A2332] leading-tight truncate">
              TBus Vietnam
            </div>
            <div className="text-[10px] text-[#8A9AAA] leading-tight mt-0.5 truncate">
              Vận tải hành khách
            </div>
          </div>
          <Settings
            size={14}
            className="text-[#C2C8D4] group-hover:text-[#169BA2] transition-colors flex-shrink-0"
          />
        </button>
      </div>
    </aside>
  );
}

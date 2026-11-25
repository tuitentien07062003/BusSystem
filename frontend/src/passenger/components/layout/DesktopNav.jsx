import { NavLink, Link } from "react-router-dom";
import { Home, Search, Ticket, User, Bus, MessagesSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "../../hooks/useAuth";

const TABS = [
  { to: "/passenger", label: "Trang chủ", icon: Home, end: true },
  { to: "/passenger/routes", label: "Tuyến xe", icon: Bus },
  { to: "/passenger/search", label: "Tìm đường", icon: Search },
  { to: "/passenger/tickets", label: "Vé của tôi", icon: Ticket },
  { to: "/passenger/feedback", label: "Góp ý", icon: MessagesSquare },
  { to: "/passenger/profile", label: "Tài khoản", icon: User },
];

export function DesktopNav() {
  const { isAuthenticated, user } = useAuth();

  return (
    <header className="hidden md:block sticky top-0 z-40 bg-white border-b border-[#E5EAF0]">
      <div className="max-w-[1200px] mx-auto px-6 h-16 flex items-center gap-6">
        <Link to="/passenger" className="flex items-center gap-2 flex-shrink-0">
          <div className="w-9 h-9 rounded-lg bg-[#169BA2] flex items-center justify-center">
            <Bus size={18} className="text-white" />
          </div>
          <div>
            <div className="text-sm font-bold text-[#1A2332] leading-tight">
              TBus Passenger
            </div>
            <div className="text-[10px] text-[#8A9AAA] leading-tight">
              Tra cứu xe buýt
            </div>
          </div>
        </Link>

        <nav className="flex items-center gap-1 flex-1 overflow-x-auto">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <NavLink
                key={tab.to}
                to={tab.to}
                end={tab.end}
                className={({ isActive }) =>
                  cn(
                    "inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap",
                    isActive
                      ? "bg-[#E6F4F5] text-[#0F7075]"
                      : "text-[#4A5A7A] hover:bg-[#F8FAFC] hover:text-[#169BA2]",
                  )
                }
              >
                <Icon size={16} />
                {tab.label}
              </NavLink>
            );
          })}
        </nav>

        {isAuthenticated ? (
          <Link
            to="/passenger/profile"
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-[#F8FAFC] flex-shrink-0"
          >
            <div className="w-8 h-8 rounded-full bg-[#169BA2] flex items-center justify-center text-white text-xs font-bold">
              {user?.full_name?.charAt(0)?.toUpperCase() || "U"}
            </div>
            <div className="text-xs font-semibold text-[#1A2332] max-w-[120px] truncate">
              {user?.full_name || "User"}
            </div>
          </Link>
        ) : (
          <Link
            to="/passenger/login"
            className="px-4 py-2 rounded-lg bg-[#169BA2] text-white text-sm font-semibold hover:bg-[#0F7075] flex-shrink-0"
          >
            Đăng nhập
          </Link>
        )}
      </div>
    </header>
  );
}

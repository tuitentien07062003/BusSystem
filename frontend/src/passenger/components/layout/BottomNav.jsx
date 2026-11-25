import { NavLink } from "react-router-dom";
import { Home, Search, Ticket, User, MessagesSquare, Bus } from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  { to: "/passenger", label: "Trang chủ", icon: Home, end: true },
  { to: "/passenger/routes", label: "Tuyến xe", icon: Bus },
  { to: "/passenger/search", label: "Tìm đường", icon: Search },
  { to: "/passenger/tickets", label: "Vé", icon: Ticket },
  { to: "/passenger/feedback", label: "Góp ý", icon: MessagesSquare },
  { to: "/passenger/profile", label: "Tài khoản", icon: User },
];

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 w-full bg-white border-t border-[#E5EAF0] z-50 md:hidden pb-[env(safe-area-inset-bottom)]">
      <div className="grid grid-cols-6 h-16">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <NavLink
              key={tab.to}
              to={tab.to}
              end={tab.end}
              className={({ isActive }) =>
                cn(
                  "flex flex-col items-center justify-center gap-0.5 transition-colors",
                  isActive ? "text-[#169BA2]" : "text-[#8A9AAA]",
                )
              }
            >
              {({ isActive }) => (
                <>
                  <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                  <span className="text-[9px] font-semibold leading-tight">
                    {tab.label}
                  </span>
                </>
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}

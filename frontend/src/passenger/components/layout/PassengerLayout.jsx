import { Outlet, useLocation } from "react-router-dom";
import { BottomNav } from "./BottomNav";
import { DesktopNav } from "./DesktopNav";
import { TravelChatWidget } from "../chat/TravelChatWidget";

const NAV_PAGES = [
  "/passenger",
  "/passenger/routes",
  "/passenger/search",
  "/passenger/tickets",
  "/passenger/feedback",
  "/passenger/profile",
];

export function PassengerLayout() {
  const location = useLocation();
  const showNav = NAV_PAGES.some(
    (p) => location.pathname === p || location.pathname === p + "/",
  );

  return (
    <div className="min-h-dvh flex flex-col bg-[#F8FAFC]">
      {showNav && <DesktopNav />}
      <main className="flex-1 w-full md:max-w-[1200px] md:mx-auto bg-white md:shadow-lg pb-16 md:pb-0">
        <Outlet />
      </main>
      <TravelChatWidget />
      {showNav && <BottomNav />}
    </div>
  );
}

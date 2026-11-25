import { useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";

export function TopBar({ title, showBack = true, right }) {
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-[#E5EAF0]">
      <div className="flex items-center h-14 px-2 gap-1">
        {showBack && (
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full hover:bg-[#F0F3F7] flex items-center justify-center transition-colors"
          >
            <ChevronLeft size={22} className="text-[#4A5A7A]" />
          </button>
        )}
        <h1 className="flex-1 text-base font-bold text-[#1A2332] truncate px-2">
          {title}
        </h1>
        {right && <div className="flex-shrink-0">{right}</div>}
      </div>
    </header>
  );
}

import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { Loader2 } from "lucide-react";

export function RequireAuth() {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-white">
        <Loader2 size={24} className="animate-spin text-[#169BA2]" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Navigate to="/passenger/login" state={{ from: location }} replace />
    );
  }

  return <Outlet />;
}

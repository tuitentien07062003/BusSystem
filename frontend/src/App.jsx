import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SimulationProvider } from "@/context/SimulationContext";
import { SimulatorPage } from "@/pages/SimulatorPage";
import { AdminLayout } from "@/admin/layouts/AdminLayout";
import { StopsAdminPage } from "@/admin/pages/StopsAdminPage";
import { RoutesAdminPage } from "@/admin/pages/RoutesAdminPage";
import { CalendarsAdminPage } from "@/admin/pages/CalendarsAdminPage";
import { TripsAdminPage } from "@/admin/pages/TripsAdminPage";
import { OrganizationPage } from "@/admin/pages/OrganizationPage";
import { EmployeesAdminPage } from "@/admin/pages/EmployeesAdminPage";
import { VehiclesAdminPage } from "@/admin/pages/VehiclesAdminPage";
import { RostersAdminPage } from "@/admin/pages/RostersAdminPage";
import { AssignmentsAdminPage } from "@/admin/pages/AssignmentsAdminPage";
import { SwapsAdminPage } from "@/admin/pages/SwapsAdminPage";
import { PassengerApp } from "./passenger/PassengerApp";
import { TicketScannerPage } from "@/admin/pages/TicketScannerPage";
import { AdminAuthProvider } from "@/admin/context/AdminAuthContext";
import { ProtectedAdminRoute } from "@/admin/components/ProtectedAdminRoute";
import { AdminLoginPage } from "@/admin/pages/AdminLoginPage";
import { StudentVerificationPage } from "@/admin/pages/StudentVerificationPage";
import { FeedbackAdminPage } from "@/admin/pages/FeedbackAdminPage";
import { StatsAdminPage } from "./admin/pages/StatsAdminPage";

const queryClient = new QueryClient({
  defaultOptions: { queries: { refetchOnWindowFocus: false, retry: 1 } },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider delayDuration={200}>
        <BrowserRouter>
          <SimulationProvider>
            <Routes>
              <Route path="/" element={<SimulatorPage />} />
              <Route path="/simulator" element={<SimulatorPage />} />

              <Route path="/passenger/*" element={<PassengerApp />} />

              <Route
                path="/admin/login"
                element={
                  <AdminAuthProvider>
                    <AdminLoginPage />
                  </AdminAuthProvider>
                }
              />

              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<Navigate to="/admin/stats" replace />} />
                <Route path="stops" element={<StopsAdminPage />} />
                <Route path="routes" element={<RoutesAdminPage />} />
                <Route path="trips" element={<TripsAdminPage />} />
                <Route path="calendars" element={<CalendarsAdminPage />} />
                <Route path="organization" element={<OrganizationPage />} />
                <Route path="employees" element={<EmployeesAdminPage />} />
                <Route path="vehicles" element={<VehiclesAdminPage />} />
                <Route path="rosters" element={<RostersAdminPage />} />
                <Route path="assignments" element={<AssignmentsAdminPage />} />
                <Route path="swaps" element={<SwapsAdminPage />} />
                <Route path="scanner" element={<TicketScannerPage />} />
                <Route path="feedbacks" element={<FeedbackAdminPage />} />
                <Route path="students" element={<StudentVerificationPage />} />
                <Route path="stats" element={<StatsAdminPage />} />
              </Route>

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
            <Toaster position="top-right" richColors closeButton />
          </SimulationProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

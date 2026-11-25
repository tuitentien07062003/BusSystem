import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { PassengerLayout } from "./components/layout/PassengerLayout";
import { RequireAuth } from "./components/auth/RequireAuth";

import { HomePage } from "./pages/HomePage";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { SearchPage } from "./pages/SearchPage";
import { TicketsPage } from "./pages/TicketsPage";
import { ProfilePage } from "./pages/ProfilePage";
import { RouteDetailPage } from "./pages/RouteDetailPage";
import { FeedbackPage } from "./pages/FeedbackPage";
import { RoutesListPage } from "./pages/RoutesListPage";
import { PayosReturnPage } from "./pages/PayosReturnPage";

export function PassengerApp() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />

        <Route element={<PassengerLayout />}>
          <Route index element={<HomePage />} />
          <Route path="search" element={<SearchPage />} />
          <Route path="routes" element={<RoutesListPage />} />
          <Route path="routes/:id" element={<RouteDetailPage />} />

          <Route element={<RequireAuth />}>
            <Route path="tickets" element={<TicketsPage />} />
            <Route path="feedback" element={<FeedbackPage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="payment/payos/return" element={<PayosReturnPage />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/passenger" replace />} />
      </Routes>
    </AuthProvider>
  );
}

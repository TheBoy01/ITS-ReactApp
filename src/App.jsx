import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import LoginPage from "./pages/LoginPage";
import TicketingPage from "./pages/TicketingPage";
import ProtectedRoute from "./routes/ProtectedRoute";
import RedirectIfAuth from "./routes/RedirectIfAuth";
import { ToastContainer } from "react-toastify";
import DashboardPage from "./pages/DashboardPage";
import TeachersPerformance from "./pages/admin/teachers/TeachersPerformance";
import AdminLayout from "./pages/admin/layout/AdminLayout";
import { DashboardDataContext } from "./contexts/GetDashboardRefData";
import Inventory from "./pages/admin/inventory/Inventory";
import TicketSupport from "./pages/admin/tickets/TicketSupport";
import PrintID from "./pages/admin/tickets/PrintID";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastContainer />
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Navigate to="/Ticket" replace />} />

          <Route path="/Ticket" element={<TicketingPage />} />

          <Route
            path="/Admin-Login"
            element={
              <RedirectIfAuth redirectTo="/admin/dashboard">
                <LoginPage />
              </RedirectIfAuth>
            }
          />

          {/* Admin routes with nested layout */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute role="admin">
                <DashboardDataContext>
                  <AdminLayout />
                </DashboardDataContext>
              </ProtectedRoute>
            }
          >
            {/* Nested routes */}
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="teachers" element={<TeachersPerformance />} />
            <Route path="inventory" element={<Inventory />} />
            <Route path="tickets/ticketsupport" element={<TicketSupport />} />
            <Route path="tickets/printid" element={<PrintID />} />
            {/* Default redirect */}
            <Route index element={<Navigate to="dashboard" replace />} />
          </Route>

          {/* Catch-all */}
          <Route
            path="*"
            element={
              <div className="flex items-center justify-center h-screen">
                <div className="text-center">
                  <h1 className="text-4xl font-bold">404</h1>
                  <p>Page not found</p>
                </div>
              </div>
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;

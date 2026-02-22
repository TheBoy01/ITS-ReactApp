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
import Footer from "./components/footer/footer";
import Clinic from "./pages/admin/clinic/Clinic";
import AdminDefaultRedirect from "./components/redirect/AdminDefaultRedirect";
import AccessDenied from "./pages/AccessDenied";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastContainer />

        {/* Full height flex container */}
        <div className="flex flex-col min-h-screen">
          {/* Main content grows to fill space */}
          <div className="flex-1">
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

              {/* Admin routes */}
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
                <Route
                  path="dashboard"
                  element={
                    <ProtectedRoute
                      role="admin"
                      requiredRoute="/admin/dashboard"
                    >
                      <DashboardPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="teachers"
                  element={
                    <ProtectedRoute
                      role="admin"
                      requiredRoute="/admin/teachers"
                    >
                      <TeachersPerformance />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="inventory"
                  element={
                    <ProtectedRoute
                      role="admin"
                      requiredRoute="/admin/inventory"
                    >
                      <Inventory />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="tickets/ticketsupport"
                  element={
                    <ProtectedRoute
                      role="admin"
                      requiredRoute="/admin/tickets/ticketsupport"
                    >
                      <TicketSupport />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="tickets/printid"
                  element={
                    <ProtectedRoute
                      role="admin"
                      requiredRoute="/admin/tickets/printid"
                    >
                      <PrintID />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="clinic"
                  element={
                    <ProtectedRoute role="admin" requiredRoute="/admin/clinic">
                      <Clinic />
                    </ProtectedRoute>
                  }
                />

                <Route index element={<AdminDefaultRedirect />} />
              </Route>
              <Route path="/access-denied" element={<AccessDenied />} />
              {/* 404 */}
              <Route
                path="*"
                element={
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <h1 className="text-4xl font-bold">404</h1>
                      <p>Page not found</p>
                    </div>
                  </div>
                }
              />
            </Routes>
          </div>

          {/* Footer stays at bottom without adding extra height */}
          <Footer />
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}
export default App;

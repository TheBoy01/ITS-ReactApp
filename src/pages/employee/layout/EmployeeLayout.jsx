import React, { useState } from "react";
import { Outlet, Navigate } from "react-router-dom";
import { useAuth } from "../../../contexts/AuthContext";
import EmployeeHeader from "./EmployeeHeader";
import EmployeeSidebar from "./EmployeeSidebar";
import SkeletonLargeBoxes from "../../../components/skeletons/SkeletonLargeBoxes";

export default function EmployeeLayout() {
  const { user, authType, loading } = useAuth();

  const [unreadCount, setUnreadCount] = useState(0);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  if (loading) return <SkeletonLargeBoxes />;
  if (!user || authType !== "employee")
    return <Navigate to="/Ticket" replace />;

  return (
    <div className="min-h-screen overflow-x-hidden bg-slate-100 text-slate-800">
      <EmployeeSidebar
        unreadTickets={unreadCount}
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
        mobileOpen={mobileSidebarOpen}
        setMobileOpen={setMobileSidebarOpen}
      />

      <div
        className={`relative min-h-screen transition-[margin] duration-300 ease-in-out ${
          sidebarCollapsed ? "md:ml-[92px]" : "md:ml-[285px]"
        }`}
      >
        <div className="sticky top-0 z-20">
          <EmployeeHeader
            unreadCount={unreadCount}
            onBellClick={() => {}}
            onMenuClick={() => setMobileSidebarOpen(true)}
            onToggleSidebar={() => setSidebarCollapsed((prev) => !prev)}
            sidebarCollapsed={sidebarCollapsed}
          />
        </div>

        <main className="w-full">
          <div className="mx-auto w-full max-w-7xl p-4 md:p-6 lg:p-8">
            <Outlet context={{ setUnreadCount }} />
          </div>
        </main>
      </div>
    </div>
  );
}

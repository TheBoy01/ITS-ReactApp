import React, { useEffect, useRef, useState } from "react";
import { useAuth } from "../../../contexts/AuthContext";
import { SwalConfirm } from "../../../utils/SwalAlert";

const Icon = ({ name, className = "" }) => (
  <i className={`fa-solid fa-${name} ${className}`} />
);

export default function Header({
  unreadCount = 0,
  onBellClick,
  onMenuClick,
  onToggleSidebar,
  sidebarCollapsed,
}) {
  const { user, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const menuRef = useRef(null);

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "?";

  const firstName = user?.name?.split(" ")[0] || "Employee";

  useEffect(() => {
    const handleOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowUserMenu(false);
      }
    };

    if (showUserMenu) {
      document.addEventListener("mousedown", handleOutside);
    }

    return () => document.removeEventListener("mousedown", handleOutside);
  }, [showUserMenu]);

  const handleLogout = async () => {
    setShowUserMenu(false);
    const ok = await SwalConfirm("Logout", "Are you sure you want to logout?");
    if (ok) logout();
  };

  return (
    <header className="sticky top-0 z-30 border-b border-[#D7DCE3] bg-[#F5F5F4] shadow-sm">
      <div className="flex h-16 items-center justify-between px-4 md:px-6">
        {/* Left */}
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuClick}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#D7DCE3] bg-white text-slate-700 transition hover:bg-slate-50 md:hidden"
            title="Open menu"
          >
            <Icon name="bars" />
          </button>

          <button
            onClick={onToggleSidebar}
            className="hidden h-10 w-10 items-center justify-center rounded-xl border border-[#D7DCE3] bg-white text-slate-700 transition hover:bg-slate-50 md:inline-flex"
            title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <Icon
              name={sidebarCollapsed ? "chevron-right" : "chevron-left"}
              className="text-[11px]"
            />
          </button>

          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
              Employee Portal
            </p>
            <h1 className="text-sm font-semibold text-slate-800 md:text-base">
              Welcome back, {firstName}
            </h1>
          </div>
        </div>

        {/* Right */}
        <div className="flex items-center gap-2 md:gap-3">
          <button
            onClick={onBellClick}
            className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#D7DCE3] bg-white text-slate-700 transition hover:bg-slate-50"
            title="Notifications"
          >
            <svg
              width="17"
              height="17"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 01-3.46 0" />
            </svg>

            {unreadCount > 0 && (
              <span className="absolute -right-1 -top-1 inline-flex min-w-[18px] items-center justify-center rounded-full border-2 border-[#F5F5F4] bg-rose-500 px-1 text-[10px] font-bold text-white">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowUserMenu((prev) => !prev)}
              className="flex items-center gap-3 rounded-2xl border border-[#D7DCE3] bg-white px-2 py-1.5 text-left transition hover:bg-slate-50"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#2563EB] to-[#3B82F6] text-xs font-bold tracking-wide text-white shadow-sm">
                {initials}
              </div>

              <div className="hidden min-w-0 sm:block">
                <p className="truncate text-sm font-semibold text-slate-800">
                  {user?.name || "Employee"}
                </p>
                <p className="truncate text-xs text-slate-500">
                  {user?.position || "Staff"}
                </p>
              </div>

              <Icon
                name="chevron-down"
                className={`hidden text-[10px] text-slate-400 transition sm:block ${
                  showUserMenu ? "rotate-180" : ""
                }`}
              />
            </button>

            {showUserMenu && (
              <div className="absolute right-0 top-[calc(100%+10px)] z-50 w-72 overflow-hidden rounded-2xl border border-[#D7DCE3] bg-white shadow-xl">
                <div className="border-b border-slate-100 bg-[#F8FAFC] p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[#2563EB] to-[#3B82F6] text-sm font-bold text-white">
                      {initials}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-800">
                        {user?.name || "Employee"}
                      </p>
                      <p className="truncate text-xs text-slate-500">
                        {user?.email || "—"}
                      </p>
                      <span className="mt-2 inline-flex rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-700">
                        {user?.position || "Staff"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-2">
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-rose-50 hover:text-rose-600"
                  >
                    <Icon name="right-from-bracket" className="text-sm" />
                    Sign out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Soft lower strip like your screenshot */}
      <div className="h-[6px] bg-[#E7EBF0]" />
    </header>
  );
}

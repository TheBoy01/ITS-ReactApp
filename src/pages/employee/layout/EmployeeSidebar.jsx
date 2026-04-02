// pages/employee/layout/EmployeeSidebar.jsx

import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../../contexts/AuthContext";

const Icon = ({ name, className = "" }) => (
  <i className={`fa-solid fa-${name} ${className}`} />
);

// ✅ PageName from DB → FA icon name mapping (add more as you add pages)
const PAGE_ICON_MAP = {
  "Create Ticket": "ticket",
  "Teacher Observation Form": "clipboard-check",
  Dashboard: "gauge",
  Reports: "chart-bar",
  Users: "users",
};

// ✅ PageName → group label mapping (controls sidebar sections)
const PAGE_GROUP_MAP = {
  "Create Ticket": "Support",
  "Teacher Observation Form": "Teaching",
  Dashboard: "General",
  Reports: "General",
};

const DEFAULT_ICON = "file";
const DEFAULT_GROUP = "General";

export default function Sidebar({
  unreadTickets = 0,
  collapsed,
  setCollapsed,
  mobileOpen,
  setMobileOpen,
}) {
  const { empPages } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // ✅ Fix in the useMemo — initialize before pushing
  // ✅ useMemo — use Pascal Case throughout
  const navGroups = React.useMemo(() => {
    const groupMap = {};

    (empPages || []).forEach((page) => {
      if (!page.CanView) return;

      const groupLabel = PAGE_GROUP_MAP[page.PageName] || DEFAULT_GROUP;

      if (!groupMap[groupLabel]) groupMap[groupLabel] = [];

      groupMap[groupLabel].push({
        pageRoute: page.PageRoute,
        pageName: page.PageName,
        icon: PAGE_ICON_MAP[page.PageName] || DEFAULT_ICON,
        canEdit: page.CanEdit,
      });
    });

    return Object.entries(groupMap).map(([groupLabel, pages]) => ({
      groupLabel,
      pages,
    }));
  }, [empPages]);

  const [openGroups, setOpenGroups] = useState([]);

  // ✅ Open all groups by default when navGroups loads
  useEffect(() => {
    setOpenGroups(navGroups.map((g) => g.groupLabel));
  }, [navGroups]);

  const toggleGroup = (label) => {
    setOpenGroups((prev) =>
      prev.includes(label) ? prev.filter((g) => g !== label) : [...prev, label],
    );
  };

  const handleNavigate = (route) => {
    navigate(route);
    setMobileOpen(false);
  };

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname, setMobileOpen]);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const handler = (e) => {
      if (e.matches) {
        setMobileOpen(false);
        document.body.style.overflow = "";
      }
    };
    if (mq.addEventListener) {
      mq.addEventListener("change", handler);
      return () => mq.removeEventListener("change", handler);
    } else {
      mq.addListener(handler);
      return () => mq.removeListener(handler);
    }
  }, [setMobileOpen]);

  useEffect(() => {
    const isMobile = window.innerWidth < 768;
    if (isMobile && mobileOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const sidebarContent = (
    <div className="flex h-full flex-col overflow-hidden bg-[#0F172A] text-slate-200">
      {/* Brand */}
      <div
        className={`flex shrink-0 items-center border-b border-white/10 ${
          collapsed ? "justify-center px-3 py-5" : "gap-3 px-4 py-5"
        }`}
      >
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[#2563EB] to-[#3B82F6] text-sm font-extrabold tracking-wide text-white shadow-lg shadow-blue-950/40">
          AU
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <p className="truncate text-xl font-bold text-white">AUS System</p>
            <p className="text-xs text-slate-400">Arab Unity School</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-5">
        {navGroups.length === 0 ? (
          <p className="px-2 text-xs text-slate-500">No pages available.</p>
        ) : (
          <div className="space-y-5">
            {navGroups.map((group) => {
              const isGroupOpen = openGroups.includes(group.groupLabel);

              return (
                <div key={group.groupLabel}>
                  {!collapsed && (
                    <button
                      type="button"
                      onClick={() => toggleGroup(group.groupLabel)}
                      className="mb-2 flex w-full items-center justify-between px-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 transition hover:text-slate-300"
                    >
                      <span>{group.groupLabel}</span>
                      <Icon
                        name={isGroupOpen ? "chevron-up" : "chevron-down"}
                        className="text-[10px]"
                      />
                    </button>
                  )}

                  <div
                    className={`overflow-hidden transition-all duration-200 ease-in-out ${
                      !collapsed && !isGroupOpen
                        ? "max-h-0 opacity-0"
                        : "max-h-96 opacity-100"
                    }`}
                  >
                    <div className="space-y-1.5">
                      {group.pages.map((page) => {
                        const isActive = location.pathname === page.pageRoute;
                        const isTicket =
                          page.pageRoute ===
                          "/employee/ticketingpage/ticketpage";

                        return (
                          <button
                            key={page.pageRoute}
                            type="button"
                            onClick={() => handleNavigate(page.pageRoute)}
                            title={collapsed ? page.pageName : undefined}
                            className={`group relative flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition-all ${
                              collapsed ? "justify-center" : ""
                            } ${
                              isActive
                                ? "bg-gradient-to-r from-[#2563EB] to-[#3B82F6] text-white shadow-lg shadow-blue-950/30"
                                : "text-slate-300 hover:bg-white/5 hover:text-white"
                            }`}
                          >
                            <span
                              className={`flex h-10 w-10 items-center justify-center rounded-xl text-sm transition ${
                                isActive
                                  ? "bg-white/10 text-white"
                                  : "bg-white/5 text-slate-300 group-hover:bg-white/10 group-hover:text-white"
                              }`}
                            >
                              <Icon name={page.icon} />
                            </span>

                            {!collapsed && (
                              <span className="flex-1 text-sm font-semibold">
                                {page.pageName}
                              </span>
                            )}

                            {/* ✅ Ticket badge */}
                            {isTicket && unreadTickets > 0 && (
                              <span
                                className={`inline-flex min-w-[18px] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white ${
                                  collapsed ? "absolute right-1 top-1" : ""
                                }`}
                              >
                                {unreadTickets > 9 ? "9+" : unreadTickets}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </nav>

      {/* Footer */}
      <div className="shrink-0 border-t border-white/10 p-3">
        <button
          type="button"
          onClick={() => setCollapsed((prev) => !prev)}
          className={`hidden w-full items-center gap-2 rounded-2xl px-3 py-2.5 text-sm font-medium text-slate-400 transition hover:bg-white/5 hover:text-white md:flex ${
            collapsed ? "justify-center" : ""
          }`}
        >
          <Icon
            name={collapsed ? "chevron-right" : "chevron-left"}
            className="text-[11px]"
          />
          {!collapsed && <span>Collapse</span>}
        </button>
        {!collapsed && (
          <p className="mt-3 px-1 text-[11px] text-slate-500">
            © {new Date().getFullYear()} Arab Unity School - IT Department
          </p>
        )}
      </div>
    </div>
  );

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity duration-300 md:hidden ${
          mobileOpen
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0"
        }`}
        onClick={() => setMobileOpen(false)}
      />
      <aside
        className={`
        fixed top-0 left-0 z-50 h-screen border-r border-white/10 bg-[#0F172A] transition-all duration-300 ease-in-out
        w-[285px]
        ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
        md:translate-x-0
        ${collapsed ? "md:w-[92px]" : "md:w-[285px]"}
      `}
      >
        <div className="absolute right-3 top-3 z-10 md:hidden">
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/10 text-white backdrop-blur transition hover:bg-white/20"
          >
            <Icon name="xmark" />
          </button>
        </div>
        {sidebarContent}
      </aside>
    </>
  );
}

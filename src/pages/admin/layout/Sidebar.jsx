import React, { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "../../../contexts/AuthContext";
import { SwalConfirm } from "../../../utils/SwalAlert";
import {
  FaHouse,
  FaTicket,
  FaBox,
  FaUsers,
  FaChevronDown,
  FaXmark,
  FaArrowRightFromBracket,
  FaLaptopMedical,
  FaGears,
  FaUsersGear,
  FaUsersRectangle,
  FaUserGraduate,
} from "react-icons/fa6";

const Sidebar = ({ isOpen, onClose }) => {
  const location = useLocation();
  const { user, userMenus, authType, logout } = useAuth();
  const [openMenus, setOpenMenus] = useState({});

  // Icon mapping for dynamic menus
  const iconMap = {
    Dashboard: FaHouse,
    "IT Support": FaTicket,
    Inventory: FaBox,
    Teachers: FaUsers,
    Clinic: FaLaptopMedical,
    Maintenance: FaGears,
    "Teachers Settings": FaUsersGear,
    "Teachers Observation": FaUsersRectangle,
    Students: FaUserGraduate,
  };

  // Default hardcoded menus (for employees or fallback)
  const defaultMenuItems = [
    //If employee default menu
    { path: "/admin/dashboard", label: "Dashboard" },
  ];

  // Determine which menus to show
  const getMenuItems = () => {
    if (authType === "admin" && userMenus && userMenus.length > 0) {
      return userMenus
        .map((menu) => {
          const filteredSubs =
            menu.subMenus && menu.subMenus.length > 0
              ? menu.subMenus.filter(
                  (sub) =>
                    sub.canView ||
                    sub.canCreate ||
                    sub.canEdit ||
                    sub.canDelete,
                )
              : [];

          return {
            menuId: menu.menuId,
            path: menu.route,
            label: menu.menuName,
            icon: iconMap[menu.menuName] || FaUserGraduate,
            submenu:
              filteredSubs.length > 0
                ? filteredSubs.map((sub) => ({
                    path: sub.route,
                    label: sub.menuName,
                  }))
                : null,
          };
        })
        .filter(
          (item) =>
            item.submenu !== null ||
            userMenus.find(
              (m) =>
                m.route === item.path &&
                (m.canView || m.canCreate || m.canEdit || m.canDelete),
            ),
        );
    }

    return defaultMenuItems;
  };

  const menuItems = getMenuItems();

  const handleLogout = async () => {
    const ok = await SwalConfirm("Logout", "Are you sure you want to logout?");
    if (ok) logout();
  };

  const toggleMenu = (menuId) => {
    setOpenMenus((prev) => ({ ...prev, [menuId]: !prev[menuId] }));
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
        fixed top-0 left-0 z-50 h-screen w-64 bg-slate-900 text-white
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0 lg:sticky lg:z-0
        flex flex-col
      `}
      >
        {/* Logo */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700 shrink-0">
          <h1 className="text-xl font-bold">
            {authType === "admin" ? "AUS Dashboard" : "Employee Panel"}
          </h1>
          <button onClick={onClose} className="lg:hidden">
            <FaXmark className="w-6 h-6" />
          </button>
        </div>

        {/* Menu Items - Scrollable */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            const hasSubmenu = item.submenu && item.submenu.length > 0;

            return (
              <div key={item.path}>
                {hasSubmenu ? (
                  <>
                    <button
                      onClick={() => toggleMenu(item.menuId)}
                      className={`
                        w-full flex items-center justify-between gap-3 px-4 py-3 rounded-lg
                        transition-colors duration-200
                        ${
                          isActive || location.pathname.startsWith(item.path)
                            ? "bg-blue-600 text-white"
                            : "text-slate-300 hover:bg-slate-800"
                        }
                      `}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="w-5 h-5" />
                        <span className="font-medium">{item.label}</span>
                      </div>
                      <FaChevronDown
                        className={`w-4 h-4 transform transition-transform duration-200 ${
                          openMenus[item.menuId] ? "rotate-180" : ""
                        }`}
                      />
                    </button>

                    {/* Submenu */}
                    <div
                      className={`
                    overflow-hidden transition-all duration-300 ease-in-out
                    ${openMenus[item.menuId] ? "max-h-48 mt-1" : "max-h-0"}
                  `}
                    >
                      <div className="ml-4 space-y-1">
                        {item.submenu.map((subItem) => {
                          const isSubActive =
                            location.pathname === subItem.path;
                          return (
                            <NavLink
                              key={subItem.path}
                              to={subItem.path}
                              onClick={onClose}
                              className={`
                                block px-4 py-2 rounded-lg text-sm
                                transition-colors duration-200
                                ${
                                  isSubActive
                                    ? "bg-blue-500 text-white"
                                    : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                                }
                              `}
                            >
                              {subItem.label}
                            </NavLink>
                          );
                        })}
                      </div>
                    </div>
                  </>
                ) : (
                  <NavLink
                    to={item.path}
                    onClick={onClose}
                    className={`
                      w-full flex items-center gap-3 px-4 py-3 rounded-lg
                      transition-colors duration-200
                      ${
                        isActive
                          ? "bg-blue-600 text-white"
                          : "text-slate-300 hover:bg-slate-800"
                      }
                    `}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                  </NavLink>
                )}
              </div>
            );
          })}
        </nav>

        {/* User Section - Fixed at bottom */}
        <div className="p-4 border-t border-slate-700 shrink-0">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex items-center justify-center w-10 h-10 bg-blue-600 rounded-full">
              {user?.name?.slice(0, 1).toUpperCase() || "U"}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">{user?.name || "User"}</p>
              <p className="text-xs text-slate-400">
                {user.position}{" "}
                {/*  {authType === "admin" ? "Administrator" : "Employee"} */}
              </p>
            </div>
          </div>
          <button
            className="flex items-center w-full gap-2 px-4 py-2 transition-colors rounded-lg text-slate-300 hover:bg-slate-800"
            onClick={handleLogout}
          >
            <FaArrowRightFromBracket className="w-5 h-5" />
            <span className="text-sm">Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;

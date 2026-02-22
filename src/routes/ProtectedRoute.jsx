import React, { useContext } from "react";
import { Navigate } from "react-router-dom";
import AuthContext from "../contexts/AuthContext";
import SkeletonLargeBoxes from "../components/skeletons/SkeletonLargeBoxes";

// Helper function to check route access
function checkRouteAccess(userMenus, route) {
  for (const menu of userMenus) {
    // Check parent menu
    if (menu.route === route && menu.canView) {
      return true;
    }

    // Check submenus
    if (menu.subMenus) {
      const submenu = menu.subMenus.find(
        (sub) => sub.route === route && sub.canView,
      );
      if (submenu) return true;
    }
  }
  return false;
}

export default function ProtectedRoute({ children, role, requiredRoute }) {
  const { user, userMenus, authType, loading } = useContext(AuthContext);

  if (loading) {
    return <SkeletonLargeBoxes />;
  }

  // Not logged in
  if (!user) {
    return <Navigate to="/Ticket" replace />;
  }

  // Not admin
  if (role === "admin" && authType !== "admin") {
    return <Navigate to="/Ticket" replace />;
  }

  // Admin with no menus
  if (
    role === "admin" &&
    authType === "admin" &&
    (!userMenus || userMenus.length === 0)
  ) {
    return <Navigate to="/access-denied" replace />;
  }

  // Check specific route access
  if (requiredRoute && authType === "admin") {
    const hasAccess = checkRouteAccess(userMenus, requiredRoute);
    if (!hasAccess) {
      return <Navigate to="/access-denied" replace />;
    }
  }

  return children;
}

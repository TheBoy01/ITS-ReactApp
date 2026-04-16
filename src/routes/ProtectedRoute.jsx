import React, { useContext } from "react";
import { Navigate } from "react-router-dom";
import AuthContext from "../contexts/AuthContext";
import SkeletonLargeBoxes from "../components/skeletons/SkeletonLargeBoxes";

function checkRouteAccess(userMenus, route) {
  for (const menu of userMenus) {
    if (menu.route === route) {
      if (menu.canView || menu.canCreate || menu.canEdit || menu.canDelete) {
        return true;
      }
    }
    if (menu.subMenus) {
      const submenu = menu.subMenus.find((sub) => sub.route === route);
      if (submenu) {
        if (
          submenu.canView ||
          submenu.canCreate ||
          submenu.canEdit ||
          submenu.canDelete
        ) {
          return true;
        }
      }
    }
  }
  return false;
}

export default function ProtectedRoute({ children, role, requiredRoute }) {
  const { user, userMenus, authType, loading } = useContext(AuthContext);

  if (loading) return <SkeletonLargeBoxes />;

  if (!user) return <Navigate to="/Ticket" replace />;

  if (role === "admin" && authType !== "admin")
    return <Navigate to="/Ticket" replace />;

  if (requiredRoute && authType === "admin") {
    const hasAccess = checkRouteAccess(userMenus, requiredRoute);
    if (!hasAccess) return <Navigate to="/access-denied" replace />;
  }

  return children;
}

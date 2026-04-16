import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const RedirectIfAuth = ({ children }) => {
  const { user, userMenus, authType, empPages, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (user) {
    // Admin → redirect to first available menu
    if (authType === "admin") {
      if (userMenus && userMenus.length > 0) {
        for (const menu of userMenus) {
          if (menu.subMenus && menu.subMenus.length > 0) {
            const firstSub = menu.subMenus.find(
              (sub) =>
                sub.canView || sub.canCreate || sub.canEdit || sub.canDelete,
            );
            if (firstSub) {
              return <Navigate to={firstSub.route} replace />;
            }
          }
          if (
            menu.canView ||
            menu.canCreate ||
            menu.canEdit ||
            menu.canDelete
          ) {
            return <Navigate to={menu.route} replace />;
          }
        }
      }
      return <Navigate to="/access-denied" replace />;
    }

    // ✅ Employee → redirect to first accessible page from JWT
    if (authType === "employee") {
      const firstPage = empPages?.find((p) => p.CanView);
      if (!firstPage) return <Navigate to="/access-denied" replace />;
      return <Navigate to={firstPage.PageRoute} replace />;
    }
  }

  return children;
};

export default RedirectIfAuth;

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
        return <Navigate to={userMenus[0].route} replace />;
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

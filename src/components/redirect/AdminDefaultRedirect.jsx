// components/AdminDefaultRedirect.js
import { Navigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

const AdminDefaultRedirect = () => {
  const { userMenus } = useAuth();

  // Check if user has menus
  if (!userMenus || userMenus.length === 0) {
    // No menus - redirect to access denied
    return <Navigate to="/access-denied" replace />;
  }

  // Get first available menu route
  const firstRoute = userMenus[0].route.replace("/admin/", "");

  return <Navigate to={firstRoute} replace />;
};

export default AdminDefaultRedirect;

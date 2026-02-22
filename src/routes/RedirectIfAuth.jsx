import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const RedirectIfAuth = ({ children }) => {
  const { user, userMenus, authType, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  // If user is authenticated
  if (user) {
    // Admin -> redirect to first available menu
    if (authType === "admin") {
      if (userMenus && userMenus.length > 0) {
        const firstMenu = userMenus[0].route;
        return <Navigate to={firstMenu} replace />;
      } else {
        // Admin with no menus - should not have access
        // Logout and show error, or redirect to access denied
        return <Navigate to="/access-denied" replace />;
      }
    }
    // Employee -> redirect to ticket page
    if (authType === "employee") {
      return <Navigate to="/Ticket" replace />;
    }
  }

  // Not authenticated, show login page
  return children;
};

export default RedirectIfAuth;

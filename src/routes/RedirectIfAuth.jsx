import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const RedirectIfAuth = ({ children }) => {
  const { user, authType, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  // If ANY user is authenticated (admin OR employee), redirect them
  if (user) {
    // Admin -> redirect to admin dashboard
    if (authType === "admin") {
      return <Navigate to="/admin/dashboard" replace />;
    }
    // Employee -> redirect to ticket page
    else {
      return <Navigate to="/Ticket" replace />;
    }
  }

  // Not authenticated, show login page
  return children;
};

export default RedirectIfAuth;

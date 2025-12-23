// RedirectIfAuth.jsx
import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function RedirectIfAuth({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>; // Or your loading component
  }

  // If user is logged in, redirect based on role
  if (user) {
    if (user.role.toLowerCase() === "admin") {
      return <Navigate to="/admin/dashboard" replace />;
    }
    return <Navigate to="/Ticket" replace />;
  }

  // Not logged in, show the login page
  return children;
}

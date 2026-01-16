/*
import React, { useContext } from "react";
import { Navigate } from "react-router-dom";
import AuthContext from "../contexts/AuthContext";

export default function ProtectedRoute({ children }) {
  const { user } = useContext(AuthContext);
  if (!user) return <Navigate to="/VerifyIDNo" replace />;
  return children;
}
*/
import React, { useContext } from "react";
import { Navigate } from "react-router-dom";
import AuthContext from "../contexts/AuthContext";
import SkeletonLargeBoxes from "../components/skeletons/SkeletonLargeBoxes";

export default function ProtectedRoute({ children, role }) {
  const { user, loading } = useContext(AuthContext); // Add loading!

  // Show loading state while checking auth
  if (loading) {
    return <SkeletonLargeBoxes />;
  }

  // Not logged in
  if (!user) {
    //alert("protected route. Invalid User!");
    return <Navigate to="/Ticket" replace />;
  }

  // Role-based redirect
  if (role && user.role !== role) {
    return user.role.toLowerCase() === "admin" ? (
      <Navigate to="/admin/dashboard" replace />
    ) : (
      <Navigate to="/Ticket" replace />
    );
  }

  return children;
}

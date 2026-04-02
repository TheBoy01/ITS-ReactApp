// routes/EmployeeProtectedRoute.jsx

import React, { useContext } from "react";
import { Navigate } from "react-router-dom";
import AuthContext from "../contexts/AuthContext";
import SkeletonLargeBoxes from "../components/skeletons/SkeletonLargeBoxes";

export default function EmployeeProtectedRoute({ children, requiredRoute }) {
  const { user, authType, empPages, loading } = useContext(AuthContext);

  if (loading) return <SkeletonLargeBoxes />;
  if (!user) return <Navigate to="/Ticket" replace />;
  if (authType !== "employee") return <Navigate to="/Ticket" replace />;

  if (requiredRoute) {
    const page = empPages?.find((p) => p.PageRoute === requiredRoute);
    if (!page || !page.CanView) return <Navigate to="/access-denied" replace />;
  }

  return children;
}

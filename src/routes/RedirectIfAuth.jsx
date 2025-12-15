import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function RedirectIfAuth({ children }) {
  const { user } = useAuth();

  // If user exists, redirect to TicketingPage
  if (user) {
    return <Navigate to="/TicketingPage" replace />;
  }

  return children;
}

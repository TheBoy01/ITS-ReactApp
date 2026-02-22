// pages/AccessDenied.js
import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function AccessDenied() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate("/Admin-Login");
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="max-w-md p-8 text-center bg-white rounded-lg shadow-lg">
        <div className="flex justify-center mb-4">
          <svg
            className="w-20 h-20 text-red-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <h1 className="mb-4 text-3xl font-bold text-gray-800">Access Denied</h1>
        <p className="mb-6 text-gray-600">
          You don't have permission to access the admin panel. Please contact
          your administrator to request access.
        </p>
        <button
          onClick={handleLogout}
          className="px-6 py-3 text-white transition-colors bg-blue-600 rounded-lg hover:bg-blue-700"
        >
          Back to Login
        </button>
      </div>
    </div>
  );
}

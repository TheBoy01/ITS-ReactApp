import React from "react";

export default function AuthCard({ children }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md bg-white rounded-lg shadow-md border p-8">
        {children}
      </div>
    </div>
  );
}

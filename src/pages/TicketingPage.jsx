import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import VerifyIDNo from "../components/ticketingpage/VerifyIDNo";
import TicketForm from "../components/ticketingpage/TicketPage";
import LoginPage from "./LoginPage";
import TicketingSkeleton from "../components/skeletons/TicketingSkeleton";

export default function TicketingPage() {
  const { token, loading, user, authType } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    EmpID: "",
    EmpName: "",
    Email: "",
    Department: "",
    Position: "",
    IdNo: "",
    EmailID: "",
  });

  // Redirect admin to dashboard if they try to access ticket page
  useEffect(() => {
    if (!loading && authType === "admin") {
      navigate("/admin/dashboard", { replace: true });
    }
  }, [loading, authType, navigate]);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  // Show skeleton while auth is loading
  if (loading) {
    return <TicketingSkeleton />;
  }

  // If admin is logged in, don't render (will redirect)
  if (authType === "admin") {
    return <TicketingSkeleton />;
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      {/* HEADER */}
      <div className="w-full h-[10vh] bg-green-600 flex items-center justify-center px-4">
        <h1 className="text-base font-semibold text-center text-white sm:text-lg md:text-xl lg:text-2xl">
          Welcome to the IT Ticketing of Arab Unity School
        </h1>
      </div>

      {/* CONTENT */}
      <div className="flex flex-col items-center px-4 py-6 sm:py-8">
        <div className="w-auto p-10 pt-2 -mt-12 bg-white shadow-lg rounded-xl">
          {/* Only show VerifyIDNo or TicketForm - remove LoginPage from here */}
          {token ? (
            <TicketForm user={user} />
          ) : (
            <VerifyIDNo formData={formData} handleChange={handleChange} />
          )}
        </div>
      </div>
    </div>
  );
}

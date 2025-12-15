import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { verifyUser } from "../../API/auth";
import { useAuth } from "../../contexts/AuthContext";
import SkeletonVerifyIDNo from "../skeletons/SkeletonVerifyIDNo";
import {
  SwalSuccess,
  SwalError,
  SwalWarning,
  ToastError,
  ToastSuccess,
} from "../../utils/SwalAlert";

export default function VerifyIDNo({ formData, handleChange }) {
  const navigate = useNavigate();
  const { createToken } = useAuth();

  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await verifyUser(formData.IdNo, formData.EmailID);
      if (response.token) {
        const loggedInUser = createToken(response.token);
        SwalSuccess("Welcome " + loggedInUser.name + "!");
      } else {
        SwalError(
          "Login Failed",
          "Please login using your correct ID number and school email."
        );
      }
    } catch (err) {
      if (err?.message === "ADMIN LOGIN") {
        SwalWarning(
          "Admin Login",
          "Hi Admin! Please provide your credentials to login."
        );
        navigate("/Admin-Login");
        return;
      } else {
        SwalError("Login Failed", err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  // ✅ FULL DIV SKELETON
  if (loading) {
    return <SkeletonVerifyIDNo />;
  }

  return (
    <div>
      <h2 className="mb-2 text-lg font-semibold sm:text-xl">
        Submit a ticket now
      </h2>

      <p className="mb-4 text-sm text-gray-600 sm:text-base">
        Simply type your ID No. and verify your identity to proceed.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* ID Number */}
        <div className="flex flex-col space-y-1">
          <label className="text-sm font-medium text-gray-700">
            ID Number <span className="text-red-600">*</span>
          </label>
          <input
            type="text"
            name="IdNo"
            maxLength={5}
            style={{ textTransform: "uppercase" }}
            onChange={handleChange}
            required
            className="w-full p-2 border rounded-lg"
          />
        </div>

        {/* Email */}
        <div className="flex flex-col space-y-1">
          <label className="text-sm font-medium text-gray-700">
            School Email Address <span className="text-red-600">*</span>
          </label>
          <input
            type="email"
            name="EmailID"
            onChange={handleChange}
            required
            className="w-full p-2 border rounded-lg"
          />
        </div>

        <button
          type="submit"
          className="w-full px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700"
        >
          Submit
        </button>
      </form>
    </div>
  );
}

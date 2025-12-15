import React, { useState, useContext } from "react";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";
import AuthCard from "../components/layout/AuthCard";
import AuthContext from "../contexts/AuthContext";
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/solid'; // or outline

export default function LoginPage() {
  const { login } = useContext(AuthContext);
  const [form, setForm] = useState({ username: "", password: "", remember: false });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((s) => ({ ...s, [name]: type === "checkbox" ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.username || !form.password) {
      setError("Please enter username and password.");
      return;
    }

    try {
      setLoading(true);
      await login(form.username, form.password, form.remember);
    } catch (err) {
      setError(err.response?.data || err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthCard>
      {/* Title */}
      <h1 className="mb-1 font-serif text-4xl text-gray-800">Log in</h1>
      <p className="mb-6 text-sm text-gray-600">
        Need an account?{" "}
        <a className="text-teal-600 underline cursor-pointer">Create an account</a>
      </p>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        <Input
          label="Username or Email"
          name="username"
          value={form.username}
          onChange={handleChange}
          placeholder="Enter username or email"
        />

        {/* Password field */}
        <div className="relative mt-1">
          <input
            name="password"
            type={showPassword ? "text" : "password"}
            value={form.password}
            onChange={handleChange}
            className="w-full px-4 py-3 pr-10 transition border rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter your password"
          />

          <button
            type="button"
            onClick={() => setShowPassword((s) => !s)}
            className="absolute inset-y-0 flex items-center text-gray-600 right-3"
          >
            {showPassword ? (
              <EyeSlashIcon className="w-5 h-5" />
            ) : (
              <EyeIcon className="w-5 h-5" />
            )}
          </button>
      </div>

        {/* Remember me */}
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            name="remember"
            checked={form.remember}
            onChange={handleChange}
            className="w-4 h-4"
          />
          <label className="text-sm text-gray-700">Keep me logged in</label>
        </div>

        {/* Error */}
        {error && <div className="text-sm text-red-600">{error}</div>}

        {/* Button */}
        <Button type="submit" disabled={loading}>
          {loading ? "Logging in..." : "Log in"}
        </Button>

        {/* Links */}
        <div className="flex justify-between mt-3 text-sm">
          <a className="text-teal-600 cursor-pointer hover:underline">Forgot username?</a>
          <a className="text-teal-600 cursor-pointer hover:underline">Forgot password?</a>
        </div>
      </form>
    </AuthCard>
  );
}

import React, { useState, useContext } from "react";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";
import AuthCard from "../components/layout/AuthCard";
import  AuthContext  from "../contexts/AuthContext";

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
      // after login, redirect or do something (router-based)
      // e.g., useNavigate() to go to /dashboard
    } catch (err) {
      setError(err.response?.data || err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthCard>
      <h1 className="text-4xl font-serif text-gray-800 mb-2">Log in</h1>
      <p className="text-sm text-gray-600 mb-6">Need a Mailchimp account? <a className="text-teal-600 underline" href="#">Create an account</a></p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Input
            label="Username or Email"
            name="username"
            value={form.username}
            onChange={handleChange}
            placeholder="Enter username or email"
          />
        </div>

        <div>
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700">Password</label>
            <button type="button" onClick={() => setShowPassword((s) => !s)} className="text-sm text-teal-700">
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
          <input
            name="password"
            type={showPassword ? "text" : "password"}
            value={form.password}
            onChange={handleChange}
            className="w-full px-4 py-2 mt-1 border rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
            placeholder="Enter password"
          />
        </div>

        <div className="flex items-center space-x-2">
          <input name="remember" type="checkbox" checked={form.remember} onChange={handleChange} />
          <label className="text-sm">Keep me logged in</label>
        </div>

        {error && <div className="text-sm text-red-600">{error}</div>}

        <div className="pt-4">
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Logging in..." : "Log in"}
          </Button>
        </div>

        <div className="flex justify-between mt-4 text-sm">
          <a className="text-teal-600 underline" href="#">Forgot username?</a>
          <a className="text-teal-600 underline" href="#">Forgot password?</a>
        </div>
      </form>
    </AuthCard>
  );
}

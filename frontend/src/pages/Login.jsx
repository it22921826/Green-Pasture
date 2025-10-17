import React, { useState } from "react";
import Hotel from "../assets/Hotel.jpg";
import { useNavigate, Link } from "react-router-dom";
import { login } from "../api/userApi"; // Ensure API is defined
import { decodeToken, hasRole } from "../utils/authHelper";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { data } = await login({ email, password });

      if (!data || !data.token) {
        throw new Error("Invalid response from server. Token missing.");
      }

      localStorage.setItem("token", data.token);
      
      // Decode token to get user role and redirect accordingly (case-insensitive)
      const user = decodeToken(data.token);
      if (user && (hasRole(user, 'Admin') || hasRole(user, 'Staff'))) {
        navigate("/dashboard");
      } else {
        navigate("/profile");
      }
    } catch (err) {
      console.error("Login error:", err);
      if (err.response && err.response.data) {
        setError(err.response.data.message || "Login failed");
      } else {
        setError(err.message || "Something went wrong");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="relative min-h-screen flex items-center justify-center p-6 md:p-10"
      style={{
        backgroundImage: `url(${Hotel})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed'
      }}
    >
      <div className="absolute inset-0 bg-black/50" />
      <div className="relative w-full max-w-md rounded-2xl border border-white/25 bg-white/70 backdrop-blur-xl shadow-2xl p-8 text-center">
        <h2 className="mb-2 text-2xl font-bold text-neutral-900">Welcome Back 👋</h2>
        <p className="mb-6 text-sm text-neutral-500">Please log in to continue</p>

        {/* Error Message */}
        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Email */}
          <div className="mb-5 text-left">
            <label htmlFor="email" className="mb-1 block font-medium">
              Email
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <Mail size={18} />
              </span>
              <input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-md border border-gray-300 pl-10 pr-3 py-2 text-[15px] outline-none transition focus:border-blue-500"
              />
            </div>
          </div>

          {/* Password */}
          <div className="mb-5 text-left">
            <label htmlFor="password" className="mb-1 block font-medium">
              Password
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <Lock size={18} />
              </span>
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full rounded-md border border-gray-300 pl-10 pr-9 py-2 text-[15px] outline-none transition focus:border-blue-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer select-none text-gray-500 hover:text-gray-700"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full rounded-md bg-blue-600 py-3 font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-500"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        {/* Spinner */}
        {loading && (
          <div className="mx-auto mt-4 h-7 w-7 animate-spin rounded-full border-2 border-gray-200 border-t-blue-600" />
        )}

        {/* Register Link */}
        <div className="mt-5 text-center text-neutral-700">
          <span className="text-neutral-700">Don’t have an account? </span>
          <Link to="/register" className="font-medium text-blue-600 underline-offset-2 hover:underline">
            Register
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;

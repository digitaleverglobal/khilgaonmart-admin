import { useState } from "react";
import { Eye, EyeOff, LogIn, ShoppingBag } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError("Email and password are required.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await login(email.trim(), password);
    } catch (err) {
      setError(err.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex bg-blue-50">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-950 via-blue-800 to-blue-700 flex-col items-center justify-center p-12 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-indigo-500 via-amber-400 to-orange-500" />
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-r from-orange-500/15 via-amber-400/15 to-indigo-500/15" />

        <div className="relative z-10 text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 via-amber-400 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-blue-950/30">
            <ShoppingBag size={40} className="text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-3">
            Khilgaon Mart Dashboard
          </h1>
          <p className="text-blue-100 text-lg mb-10">
            Complete E-Commerce Management System
          </p>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3 text-center">
            {[
              { label: "Orders", value: "Manage" },
              { label: "Products", value: "Control" },
              { label: "Reports", value: "Analyze" },
            ].map((item) => (
              <div
                key={item.label}
                className="bg-white/10 backdrop-blur rounded-xl p-4 border border-white/10"
              >
                <p className="text-orange-300 font-semibold text-sm">
                  {item.value}
                </p>
                <p className="text-blue-100 text-xs mt-1">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel - Login form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 via-amber-400 to-orange-500 rounded-xl flex items-center justify-center">
              <ShoppingBag size={20} className="text-white" />
            </div>
            <span className="text-xl font-bold text-slate-800">
              Khilgaon Mart Dashboard
            </span>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-1">
              Welcome back
            </h2>
            <p className="text-gray-500 text-sm mb-8">
              Sign in to your admin account
            </p>

            {error && (
              <div className="mb-5 flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
                <span className="mt-0.5 shrink-0">⚠</span>
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Email address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@example.com"
                  autoComplete="email"
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-500 text-sm transition placeholder-gray-400"
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    className="w-full px-4 py-2.5 pr-11 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-500 text-sm transition placeholder-gray-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Remember me */}
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-blue-500 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-600">Remember me</span>
                </label>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold py-2.5 rounded-lg transition text-sm"
              >
                {loading ? (
                  <svg
                    className="animate-spin h-4 w-4 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v8H4z"
                    />
                  </svg>
                ) : (
                  <LogIn size={16} />
                )}
                {loading ? "Signing in..." : "Sign in"}
              </button>
            </form>

            <p className="mt-6 text-center text-xs text-gray-400">
              Protected admin area. Unauthorized access is prohibited.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

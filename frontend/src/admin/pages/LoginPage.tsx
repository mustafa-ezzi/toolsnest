import { useState, type FormEvent } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAdminAuth } from "../AuthContext";

export default function AdminLoginPage() {
  const { user, login } = useAdminAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("admin123");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to="/admin" replace />;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(username, password);
      navigate("/admin");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0f1419] px-4">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-md rounded-2xl border border-white/10 bg-[#111827] p-8 shadow-xl"
      >
        <div className="mb-6 text-center">
          <span className="brand-font text-2xl font-bold text-white">
            Tools<span className="text-[#2dd4bf]">Nest</span>
          </span>
          <p className="mt-2 text-sm text-slate-400">Admin Panel</p>
        </div>

        {error && (
          <p className="mb-4 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">
            {error}
          </p>
        )}

        <label className="mb-4 block">
          <span className="mb-1 block text-sm text-slate-400">Username</span>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-[#0f1419] px-4 py-2.5 text-white outline-none focus:border-[#2dd4bf]"
            autoComplete="username"
          />
        </label>

        <label className="mb-6 block">
          <span className="mb-1 block text-sm text-slate-400">Password</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-[#0f1419] px-4 py-2.5 text-white outline-none focus:border-[#2dd4bf]"
            autoComplete="current-password"
          />
        </label>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-[#2dd4bf] py-3 text-sm font-semibold text-[#0f1419] disabled:opacity-60"
        >
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}

import { Navigate, Outlet } from "react-router-dom";
import { getToken } from "./api";
import { useAdminAuth } from "./AuthContext";

export function AdminProtectedRoute() {
  const { user, loading } = useAdminAuth();
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0f1419] text-slate-400">
        Loading…
      </div>
    );
  }
  if (!user && !getToken()) {
    return <Navigate to="/admin/login" replace />;
  }
  return <Outlet />;
}

import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

export const ProtectedRoute: React.FC = () => {
  const { session, loading } = useAuth();
  const location = useLocation();

  // Wait for auth to be verified before allowing access
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="flex flex-col items-center">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-slate-600 font-medium font-sans text-sm">
            Loading...
          </p>
        </div>
      </div>
    );
  }

  // Redirect to login if no session after verification is complete
  if (!session) {
    const returnUrl = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?returnUrl=${returnUrl}`} replace />;
  }

  return <Outlet />;
};

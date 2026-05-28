import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

interface RoleRouteProps {
  allowedRoles: ("agent" | "admin" | "client")[];
}

export const RoleRoute: React.FC<RoleRouteProps> = ({ allowedRoles }) => {
  const { profile, loading } = useAuth();

  // Wait for profile to load before checking permissions
  if (loading || !profile) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="flex flex-col items-center">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-slate-600 font-medium font-sans text-sm">
            Verifying permissions...
          </p>
        </div>
      </div>
    );
  }

  // Verify user has allowed role
  if (!allowedRoles.includes(profile.role)) {
    if (profile.role === "agent" || profile.role === "admin") {
      return <Navigate to="/dashboard" replace />;
    } else {
      return <Navigate to="/portal" replace />;
    }
  }

  return <Outlet />;
};

import React from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { Building2, LogOut, User, Menu, X } from "lucide-react";
import { toast } from "react-hot-toast";

export const Navbar: React.FC = () => {
  const { session, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const isAuthenticated = !!session;

  const handleLogout = async () => {
    try {
      await signOut();
      toast.success("Logged out successfully");
      navigate("/");
    } catch (err: any) {
      toast.error("Failed to log out");
    }
  };

  return (
    <nav className="bg-slate-900 border-b border-slate-800 sticky top-0 z-50 text-white font-sans shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link
              to="/"
              className="flex items-center gap-2 group cursor-pointer"
            >
              <div className="bg-blue-600 p-2 rounded-xl text-white shadow shadow-blue-500/20 group-hover:scale-105 transition">
                <Building2 className="w-5 h-5" />
              </div>
              <span className="font-sans font-extrabold text-lg tracking-tight hover:text-blue-400 transition text-white">
                BuildProConnect
              </span>
            </Link>

            {/* Nav links — only visible to authenticated users */}
            {isAuthenticated && (
              <div className="hidden md:ml-8 md:flex space-x-6 text-sm">
                <NavLink
                  to="/"
                  className={({ isActive }) =>
                    `font-semibold transition ${isActive ? "text-blue-400" : "text-slate-300 hover:text-white"}`
                  }
                >
                  Home
                </NavLink>
                <NavLink
                  to="/properties"
                  className={({ isActive }) =>
                    `font-semibold transition ${isActive ? "text-blue-400" : "text-slate-300 hover:text-white"}`
                  }
                >
                  Properties
                </NavLink>
                <NavLink
                  to={profile?.role === "client" ? "/portal" : "/dashboard"}
                  className={({ isActive }) =>
                    `font-semibold transition ${isActive ? "text-blue-400" : "text-slate-300 hover:text-white"}`
                  }
                >
                  My workspace
                </NavLink>
              </div>
            )}
          </div>

          {/* Right side — auth area */}
          <div className="hidden md:flex items-center gap-4">
            {session && profile ? (
              <>
                {/* User pill */}
                <div className="flex items-center gap-4 bg-slate-800/50 hover:bg-slate-850/80 p-1.5 pr-4 rounded-full border border-slate-800 transition">
                  <div className="w-8 h-8 rounded-full bg-blue-600 border border-blue-500 flex items-center justify-center text-white text-xs font-bold font-mono">
                    {profile?.full_name?.charAt(0).toUpperCase() || (
                      <User className="w-4 h-4" />
                    )}
                  </div>
                  <div className="text-left leading-none">
                    <span className="block text-xs font-bold text-slate-100">
                      {profile?.full_name || "My Account"}
                    </span>
                    <span className="text-[9px] font-mono font-semibold tracking-wider text-blue-400 uppercase leading-none mt-0.5 block">
                      {profile?.role || "User"}
                    </span>
                  </div>
                  <div className="h-4 w-[1px] bg-slate-700 mx-1"></div>
                  <button
                    onClick={handleLogout}
                    className="p-1 text-slate-400 hover:text-red-400 hover:bg-slate-800/80 rounded-full transition cursor-pointer"
                    title="Logout Session"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </>
            ) : (
              // Not authenticated — only show auth buttons
              <div className="flex items-center gap-3">
                <Link
                  to="/login"
                  className="px-4 py-2 text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-800/50 rounded-xl transition cursor-pointer"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/10 transition cursor-pointer"
                >
                  Register Account
                </Link>
              </div>
            )}
          </div>

          {/* Burger trigger */}
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="p-2 text-slate-350 hover:text-white hover:bg-slate-800 rounded-lg transition"
            >
              {mobileOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile panel */}
      {mobileOpen && (
        <div className="md:hidden border-t border-slate-800 bg-slate-900/95 backdrop-blur-md px-4 py-3 space-y-3">
          {/* Nav links — authenticated only */}
          {isAuthenticated && (
            <>
              <Link
                to="/"
                onClick={() => setMobileOpen(false)}
                className="block px-3 py-2 rounded-xl text-sm font-semibold hover:bg-slate-800 text-slate-200 hover:text-white"
              >
                Home
              </Link>
              <Link
                to="/properties"
                onClick={() => setMobileOpen(false)}
                className="block px-3 py-2 rounded-xl text-sm font-semibold hover:bg-slate-800 text-slate-200 hover:text-white"
              >
                Properties
              </Link>
              <Link
                to={profile?.role === "client" ? "/portal" : "/dashboard"}
                onClick={() => setMobileOpen(false)}
                className="block px-3 py-2 rounded-xl text-sm font-semibold hover:bg-slate-800 text-slate-200 hover:text-white"
              >
                My Workspace
              </Link>
            </>
          )}

          {/* Mobile auth section */}
          <div
            className={isAuthenticated ? "border-t border-slate-800 pt-3" : ""}
          >
            {session && profile ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold font-mono">
                    {profile?.full_name?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-100">
                      {profile?.full_name}
                    </p>
                    <p className="text-[10px] text-slate-400 capitalize">
                      {profile?.role}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setMobileOpen(false);
                    handleLogout();
                  }}
                  className="p-2 text-slate-400 hover:text-red-400 bg-slate-800/50 rounded-xl transition cursor-pointer font-mono"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Link
                  to="/login"
                  onClick={() => setMobileOpen(false)}
                  className="text-center py-2 text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl transition"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileOpen(false)}
                  className="text-center py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

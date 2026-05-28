import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { 
  Building2, LogOut, User, Menu, X, Landmark, 
  Bell, AlertTriangle, CalendarDays, Clock, ChevronRight
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';

export const Navbar: React.FC = () => {
  const { session, profile, signOut, loading } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [bellOpen, setBellOpen] = useState(false);

  const userId = session?.user?.id;
  const isAgentOrAdmin = profile?.role === 'agent' || profile?.role === 'admin';
  const isAuthenticated = !loading && !!session;

  const { data: pendingReminders, refetch: refetchReminders } = useQuery<any[]>({
    queryKey: ['navbarReminders', userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from('reminders')
        .select('*')
        .eq('agent_id', userId)
        .eq('status', 'pending')
        .order('due_at', { ascending: true });

      if (error) {
        console.warn('Popover reminders query error:', error);
        return [];
      }
      return data || [];
    },
    enabled: !!userId && isAgentOrAdmin,
    refetchInterval: 30000,
  });

  const handleLogout = async () => {
    try {
      await signOut();
      toast.success('Logged out successfully');
      navigate('/');
    } catch (err: any) {
      toast.error('Failed to log out');
    }
  };

  const now = new Date();
  const overdueReminders = (pendingReminders || []).filter(rem => new Date(rem.due_at) < now);
  const hasOverdue = overdueReminders.length > 0;
  const nextReminders = (pendingReminders || []).slice(0, 5);

  return (
    <nav className="bg-slate-900 border-b border-slate-800 sticky top-0 z-50 text-white font-sans shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">

          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-2 group cursor-pointer">
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
                    `font-semibold transition ${isActive ? 'text-blue-400' : 'text-slate-300 hover:text-white'}`
                  }
                >
                  Home
                </NavLink>
                <NavLink
                  to="/properties"
                  className={({ isActive }) =>
                    `font-semibold transition ${isActive ? 'text-blue-400' : 'text-slate-300 hover:text-white'}`
                  }
                >
                  Properties
                </NavLink>
                <NavLink
                  to={profile?.role === 'client' ? '/portal' : '/dashboard'}
                  className={({ isActive }) =>
                    `font-semibold transition ${isActive ? 'text-blue-400' : 'text-slate-300 hover:text-white'}`
                  }
                >
                  My Workspace
                </NavLink>
              </div>
            )}
          </div>

          {/* Right side — auth area */}
          <div className="hidden md:flex items-center gap-4">
            {loading ? (
              // Skeleton while auth resolves
              <div className="flex items-center gap-3 bg-slate-800/40 p-1.5 pr-4 rounded-full border border-slate-800">
                <div className="w-8 h-8 rounded-full bg-slate-700 animate-pulse" />
                <div className="space-y-1.5">
                  <div className="w-20 h-2.5 bg-slate-700 rounded animate-pulse" />
                  <div className="w-12 h-2 bg-slate-700 rounded animate-pulse" />
                </div>
              </div>
            ) : session ? (
              <>
                {/* Reminder Bell — agents/admins only */}
                {isAgentOrAdmin && (
                  <div className="relative">
                    <button
                      onClick={() => setBellOpen(!bellOpen)}
                      className={`p-2 rounded-xl border border-slate-850 hover:bg-slate-800 transition cursor-pointer relative ${
                        bellOpen ? 'bg-slate-800 text-blue-400' : 'text-slate-300 hover:text-white'
                      }`}
                      title="Timeline reminders"
                    >
                      <Bell className="w-5 h-5" />
                      {pendingReminders && pendingReminders.length > 0 && (
                        <span className={`absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow border ${
                          hasOverdue
                            ? 'bg-red-600 border-red-500 animate-pulse'
                            : 'bg-amber-500 border-amber-400'
                        }`}>
                          {pendingReminders.length}
                        </span>
                      )}
                    </button>

                    {bellOpen && (
                      <div className="absolute right-0 mt-3 w-80 bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl p-4 z-50 text-xs text-slate-100 font-sans space-y-3 animate-in fade-in duration-200">
                        <div className="flex justify-between items-center border-b border-slate-850 pb-2.5">
                          <div>
                            <h4 className="font-bold text-white text-[12px]">Agenda Reminders</h4>
                            {hasOverdue && (
                              <span className="text-[10px] text-red-500 font-bold block mt-0.5">⚠️ Overdue tasks detected!</span>
                            )}
                          </div>
                          <span className="text-[10px] bg-slate-850 px-2 py-0.5 rounded text-slate-400 font-mono font-bold uppercase shrink-0">
                            Pending: {pendingReminders?.length || 0}
                          </span>
                        </div>

                        <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                          {nextReminders && nextReminders.length > 0 ? (
                            nextReminders.map((rem) => {
                              const isOverdue = new Date(rem.due_at) < now;
                              return (
                                <div
                                  key={rem.id}
                                  onClick={() => {
                                    setBellOpen(false);
                                    navigate('/dashboard/reminders');
                                  }}
                                  className={`p-2.5 bg-slate-900/60 hover:bg-slate-850 border rounded-xl cursor-pointer transition leading-tight flex items-start gap-2 ${
                                    isOverdue ? 'border-red-900/60 bg-red-950/10' : 'border-slate-850'
                                  }`}
                                >
                                  {isOverdue ? (
                                    <AlertTriangle className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />
                                  ) : (
                                    <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                                  )}
                                  <div className="text-left flex-1 min-w-0">
                                    <p className="font-bold text-slate-200 truncate">{rem.title}</p>
                                    <p className={`text-[10px] font-mono mt-1 font-semibold ${isOverdue ? 'text-red-400 font-extrabold' : 'text-slate-400'}`}>
                                      {format(new Date(rem.due_at), 'MMM d, h:mm a')}
                                    </p>
                                  </div>
                                </div>
                              );
                            })
                          ) : (
                            <div className="text-center py-6 text-slate-500">
                              <p>No upcoming timelines pending.</p>
                            </div>
                          )}
                        </div>

                        <div className="border-t border-slate-850 pt-2 flex items-center justify-center">
                          <button
                            onClick={() => {
                              setBellOpen(false);
                              navigate('/dashboard/reminders');
                            }}
                            className="text-[10.5px] font-bold text-blue-400 hover:text-blue-300 inline-flex items-center gap-0.5 uppercase tracking-wide cursor-pointer py-1"
                          >
                            Launch Reminders Console <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* User pill */}
                <div className="flex items-center gap-4 bg-slate-800/50 hover:bg-slate-850/80 p-1.5 pr-4 rounded-full border border-slate-800 transition">
                  <div className="w-8 h-8 rounded-full bg-blue-600 border border-blue-500 flex items-center justify-center text-white text-xs font-bold font-mono">
                    {profile?.full_name?.charAt(0).toUpperCase() || <User className="w-4 h-4" />}
                  </div>
                  <div className="text-left leading-none">
                    <span className="block text-xs font-bold text-slate-100">{profile?.full_name || 'My Account'}</span>
                    <span className="text-[9px] font-mono font-semibold tracking-wider text-blue-400 uppercase leading-none mt-0.5 block">
                      {profile?.role || 'User'}
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
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
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
                to={profile?.role === 'client' ? '/portal' : '/dashboard'}
                onClick={() => setMobileOpen(false)}
                className="block px-3 py-2 rounded-xl text-sm font-semibold hover:bg-slate-800 text-slate-200 hover:text-white"
              >
                My Workspace
              </Link>
            </>
          )}

          {/* Mobile auth section */}
          <div className={isAuthenticated ? 'border-t border-slate-800 pt-3' : ''}>
            {loading ? (
              <div className="flex items-center gap-3 px-1">
                <div className="w-8 h-8 rounded-full bg-slate-700 animate-pulse shrink-0" />
                <div className="space-y-1.5 flex-1">
                  <div className="w-24 h-2.5 bg-slate-700 rounded animate-pulse" />
                  <div className="w-14 h-2 bg-slate-700 rounded animate-pulse" />
                </div>
              </div>
            ) : session ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold font-mono">
                    {profile?.full_name?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-100">{profile?.full_name}</p>
                    <p className="text-[10px] text-slate-400 capitalize">{profile?.role}</p>
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
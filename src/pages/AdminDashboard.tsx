import React from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Building2, Users, ShieldAlert, LogOut, Sliders, BarChart3, ArrowLeft } from 'lucide-react';
import { AdminUsers } from './AdminUsers';
import { AdminReports } from './AdminReports';

export const AdminDashboard: React.FC = () => {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const activeTab = location.pathname.endsWith('/reports') ? 'reports' : 'users';

  return (
    <div className="flex min-h-[90vh] bg-slate-50 font-sans">
      {/* Sidebar: styled with deep color */}
      <aside className="w-64 bg-slate-900 text-slate-100 flex flex-col shrink-0 border-r border-slate-800">
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="bg-red-600 p-2 rounded-xl text-white shadow shadow-red-500/20">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-sm leading-tight text-white">BuildProConnect</h2>
              <span className="text-[10px] text-red-400 font-mono tracking-wider font-semibold uppercase">Admin Panel</span>
            </div>
          </div>
        </div>

        <div className="p-4 flex-1 space-y-1.5 text-xs">
          <button
            onClick={() => navigate('/admin/users')}
            className={`w-full text-left px-4 py-2.5 rounded-xl font-bold flex items-center gap-3 transition cursor-pointer ${
              activeTab === 'users' ? 'bg-red-600 text-white shadow-md shadow-red-500/10' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" />
            Control User Accounts
          </button>

          <button
            onClick={() => navigate('/admin/reports')}
            className={`w-full text-left px-4 py-2.5 rounded-xl font-bold flex items-center gap-3 transition cursor-pointer ${
              activeTab === 'reports' ? 'bg-red-600 text-white shadow-md shadow-red-500/10' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            Platform reports
          </button>

          <div className="pt-4 border-t border-slate-800 mt-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="w-full text-left px-4 py-2.5 rounded-xl text-slate-400 hover:bg-slate-800 hover:text-white font-bold flex items-center gap-3 transition cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 text-slate-500" />
              Agent Console
            </button>
          </div>
        </div>

        <div className="p-4 border-t border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center text-white text-xs font-bold font-mono">
              {profile?.full_name?.charAt(0).toUpperCase() || 'A'}
            </div>
            <div className="truncate max-w-[120px]">
              <p className="text-xs font-bold text-white truncate">{profile?.full_name || 'Admin Administrator'}</p>
              <p className="text-[10px] text-slate-500 truncate">{user?.email}</p>
            </div>
          </div>
          <button 
            onClick={signOut}
            title="Log out"
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* Admin Central View */}
      <main className="flex-grow p-8 overflow-y-auto">
        <header className="mb-8">
          <span className="text-[10px] bg-red-50 text-red-605 font-mono font-bold tracking-wider rounded px-2.5 py-1 inline-block uppercase border border-red-105" style={{ color: '#dc2626' }}>
            ROOT ADMINISTRATIVE LEVEL
          </span>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight font-sans mt-2">
            {activeTab === 'users' ? 'Accounts Registry' : 'Platform Traffic & Insights'}
          </h1>
          <p className="text-slate-500 text-xs mt-1">
            System status: nominal. Live encryption, safety policies and triggers operation satisfies audits.
          </p>
        </header>

        {/* Nested routing logic */}
        <Routes>
          <Route path="/" element={<AdminUsers />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="reports" element={<AdminReports />} />
        </Routes>
      </main>
    </div>
  );
};


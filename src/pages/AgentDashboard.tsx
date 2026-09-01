import React from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { 
  Building2, Users, MessageSquare, CheckCircle, 
  CalendarClock, Settings, LayoutDashboard, Plus, 
  MapPin, LogOut, Loader2, AlertTriangle, Clock, ListChecks,
  ChevronRight, Calendar, Bookmark, FileText, Phone, Mail, MessageSquareText
} from 'lucide-react';
import { format } from 'date-fns';

// CRM pages
import { AgentPropertiesList } from './AgentPropertiesList';
import { AgentPropertyForm } from './AgentPropertyForm';
import { ClientsList } from './ClientsList';
import { ClientNew } from './ClientNew';
import { ClientDetail } from './ClientDetail';
import { RemindersList } from './RemindersList';
import { InquiriesList } from './InquiriesList';
import { AgentReports } from './AgentReports';
import { UserSettings } from './UserSettings';
import { BarChart3 } from 'lucide-react';
import { useDashboardKpisQuery } from '../features/dashboard/hooks/useDashboardQueries';
import { useUpcomingRemindersQuery } from '../features/reminders/hooks/useReminderQueries';
import { useRecentInteractionsQuery } from '../features/interactions/hooks/useInteractionQueries';

export const AgentDashboard: React.FC = () => {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const userId = user?.id;

  // Dynamically calculate active tabs
  const getActiveTab = () => {
    const path = location.pathname;
    if (path.startsWith('/dashboard/properties')) {
      return 'listings';
    } else if (path.startsWith('/dashboard/clients')) {
      return 'clients';
    } else if (path.startsWith('/dashboard/inquiries')) {
      return 'inquiries';
    } else if (path.startsWith('/dashboard/reminders')) {
      return 'reminders';
    } else if (path.startsWith('/dashboard/reports')) {
      return 'reports';
    } else if (path.startsWith('/dashboard/settings')) {
      return 'settings';
    }
    return 'dashboard';
  };

  const activeTab = getActiveTab();

  // 1. Fetch live metrics stats for KPIs
  const { data: kpis, isLoading: isKpisLoading } = useDashboardKpisQuery(userId);

  // 2. Fetch upcoming reminders (max 5 upcoming pending)
  const { data: upcomingReminders = [], isLoading: isRemindersLoading } = useUpcomingRemindersQuery(userId, 5);

  // 3. Fetch recent interactions (max 10 chronological)
  const { data: recentInteractions = [], isLoading: isInteractionsLoading } = useRecentInteractionsQuery(userId);

  // Helper interaction icon mapping
  const getInteractionIcon = (type: string) => {
    switch (type) {
      case 'call':
        return <Phone className="w-3.5 h-3.5 text-emerald-600" />;
      case 'email':
        return <Mail className="w-3.5 h-3.5 text-blue-600" />;
      case 'meeting':
        return <Calendar className="w-3.5 h-3.5 text-indigo-600" />;
      case 'site_visit':
        return <Building2 className="w-3.5 h-3.5 text-amber-600" />;
      case 'whatsapp':
        return <MessageSquareText className="w-3.5 h-3.5 text-green-600" />;
      default:
        return <FileText className="w-3.5 h-3.5 text-slate-500" />;
    }
  };

  return (
    <div className="flex min-h-[90vh] bg-slate-50 font-sans">
      
      {/* Sidebar navigation panel */}
      <aside className="w-64 bg-slate-900 text-slate-100 flex flex-col shrink-0 border-r border-slate-800">
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-2 rounded-xl text-white">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-sm leading-tight text-white">BuildProConnect</h2>
              <span className="text-[10px] text-blue-400 font-mono tracking-wider font-semibold uppercase">Agent Console</span>
            </div>
          </div>
        </div>

        <div className="p-4 flex-1 space-y-1.5 text-xs">
          <button
            onClick={() => navigate('/dashboard')}
            className={`w-full text-left px-4 py-2.5 rounded-xl font-bold flex items-center gap-3 transition cursor-pointer ${
              activeTab === 'dashboard' ? 'bg-blue-600 text-white shadow-md shadow-blue-500/10' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            Workspace Home
          </button>
          
          <button
            onClick={() => navigate('/dashboard/properties')}
            className={`w-full text-left px-4 py-2.5 rounded-xl font-bold flex items-center gap-3 transition cursor-pointer ${
              activeTab === 'listings' ? 'bg-blue-600 text-white shadow-md shadow-blue-500/10' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Building2 className="w-4 h-4" />
            Property Listings
          </button>
          
          <button
            onClick={() => navigate('/dashboard/clients')}
            className={`w-full text-left px-4 py-2.5 rounded-xl font-bold flex items-center gap-3 transition cursor-pointer ${
              activeTab === 'clients' ? 'bg-blue-600 text-white shadow-md shadow-blue-500/10' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" />
            CRM Clients
          </button>
          
          <button
            onClick={() => navigate('/dashboard/inquiries')}
            className={`w-full text-left px-4 py-2.5 rounded-xl font-bold flex items-center gap-3 transition cursor-pointer ${
              activeTab === 'inquiries' ? 'bg-blue-600 text-white shadow-md shadow-blue-500/10' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            Leads & Inquiries
          </button>

          <button
            onClick={() => navigate('/dashboard/reminders')}
            className={`w-full text-left px-4 py-2.5 rounded-xl font-bold flex items-center gap-3 transition cursor-pointer ${
              activeTab === 'reminders' ? 'bg-blue-600 text-white shadow-md shadow-blue-500/10' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <CalendarClock className="w-4 h-4" />
            Follow-up Reminders
          </button>

          <button
            onClick={() => navigate('/dashboard/reports')}
            className={`w-full text-left px-4 py-2.5 rounded-xl font-bold flex items-center gap-3 transition cursor-pointer ${
              activeTab === 'reports' ? 'bg-blue-600 text-white shadow-md shadow-blue-500/10' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            Insights & Reports
          </button>

          <button
            onClick={() => navigate('/dashboard/settings')}
            className={`w-full text-left px-4 py-2.5 rounded-xl font-bold flex items-center gap-3 transition cursor-pointer ${
              activeTab === 'settings' ? 'bg-blue-600 text-white shadow-md shadow-blue-500/10' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Settings className="w-4 h-4" />
            Account Settings
          </button>
        </div>

        {/* User profile footer info */}
        <div className="p-4 border-t border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold font-mono shrink-0">
              {profile?.full_name?.charAt(0) || user?.email?.charAt(0).toUpperCase()}
            </div>
            <div className="truncate max-w-[120px]">
              <p className="text-xs font-bold text-white truncate leading-tight">{profile?.full_name}</p>
              <p className="text-[9px] text-slate-500 truncate leading-tight mt-0.5 capitalize">{profile?.role}</p>
            </div>
          </div>
          <button 
            onClick={signOut}
            title="Log out session"
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* Main content pane */}
      <main className="flex-1 p-8 overflow-y-auto">
        <header className="mb-8">
          <span className="text-[10px] bg-blue-50 text-blue-600 font-mono font-bold tracking-wider rounded px-2.5 py-1 inline-block uppercase border border-blue-100">
            Active Workspace Session
          </span>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight font-sans mt-2">
            Welcome back, {profile?.full_name || 'Agent'}
          </h1>
          <p className="text-slate-500 text-xs mt-1">
            BuildProConnect status synchronized. All real estate analytics and client directories are live.
          </p>
        </header>

        {/* Dynamic Nested Routes */}
        <Routes>
          
          {/* Dashboard General Overview Home Page content */}
          <Route 
            path="/" 
            element={
              <div className="space-y-8">
                
                {/* Real connected CRM metrics statistics block */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-xs">
                  
                  {/* KPI - Active available listings */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs relative overflow-hidden">
                    <span className="text-[10px] font-bold text-slate-400 font-mono uppercase tracking-wider">Active Listings</span>
                    {isKpisLoading ? (
                      <Loader2 className="w-5 h-5 text-blue-600 animate-spin mt-2" />
                    ) : (
                      <p className="text-2xl font-extrabold tracking-tight text-slate-900 mt-2">
                        {kpis?.activeListings ?? 0}
                      </p>
                    )}
                    <span className="text-[10px] text-green-600 font-semibold mt-1 block">Property database active</span>
                  </div>

                  {/* KPI - Active CRM Clients list count */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs">
                    <span className="text-[10px] font-bold text-slate-400 font-mono uppercase tracking-wider">Active Clients</span>
                    {isKpisLoading ? (
                      <Loader2 className="w-5 h-5 text-blue-600 animate-spin mt-2" />
                    ) : (
                      <p className="text-2xl font-extrabold tracking-tight text-slate-900 mt-2">
                        {kpis?.activeClients ?? 0}
                      </p>
                    )}
                    <span className="text-[10px] text-blue-600 font-semibold mt-1 block">Target clients engaged</span>
                  </div>

                  {/* KPI - Pending Calendar follow-ups reminders */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs">
                    <span className="text-[10px] font-bold text-slate-400 font-mono uppercase tracking-wider">Pending Tasks</span>
                    {isKpisLoading ? (
                      <Loader2 className="w-5 h-5 text-blue-600 animate-spin mt-2" />
                    ) : (
                      <p className="text-2xl font-extrabold tracking-tight text-slate-900 mt-2">
                        {kpis?.pendingReminders ?? 0}
                      </p>
                    )}
                    <span className="text-[10px] text-amber-600 font-semibold mt-1 block">Timelines prioritized</span>
                  </div>

                  {/* KPI - Inquiries in the past 1 week */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs">
                    <span className="text-[10px] font-bold text-slate-400 font-mono uppercase tracking-wider">Recent Inquiries</span>
                    {isKpisLoading ? (
                      <Loader2 className="w-5 h-5 text-blue-600 animate-spin mt-2" />
                    ) : (
                      <p className="text-2xl font-extrabold tracking-tight text-slate-900 mt-2">
                        {kpis?.recentInquiries ?? 0}
                      </p>
                    )}
                    <span className="text-[10px] text-emerald-600 font-semibold mt-1 block">Submitted last 7 days</span>
                  </div>

                </div>

                {/* Sub widgets: Upcoming Reminders & Chronological Activity feed */}
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                  
                  {/* Left segment (Upcoming Reminders widget) (occupies 2/5 columns) */}
                  <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 p-6 shadow-xs flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-center border-b border-slate-50 pb-3 mb-4">
                        <h3 className="text-xs font-bold uppercase text-slate-500 tracking-wider font-mono">Upcoming Reminders</h3>
                        <button 
                          onClick={() => navigate('/dashboard/reminders')}
                          className="text-[10.5px] text-blue-600 hover:text-blue-800 font-bold font-sans flex items-center shrink-0 cursor-pointer"
                        >
                          View Checklist <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {isRemindersLoading ? (
                        <div className="flex justify-center py-6">
                          <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
                        </div>
                      ) : upcomingReminders && upcomingReminders.length > 0 ? (
                        <div className="space-y-3 text-xs leading-normal font-sans">
                          {upcomingReminders.map((rem) => {
                            const isOverdue = new Date(rem.due_at) < new Date();
                            return (
                              <div key={rem.id} className={`p-3 bg-slate-50 rounded-xl border flex items-start gap-2 ${
                                isOverdue ? 'border-red-150 bg-red-50/20' : 'border-slate-100'
                              }`}>
                                {isOverdue ? (
                                  <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                                ) : (
                                  <Clock className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                                )}
                                <div className="leading-tight flex-grow min-w-0">
                                  <p className="font-bold text-slate-900 truncate">{rem.title}</p>
                                  {rem.clients && (
                                    <p className="text-[10px] text-slate-500 mt-0.5 font-semibold">Client: {rem.clients.full_name}</p>
                                  )}
                                  <p className={`text-[9.5px] font-mono mt-1 font-semibold ${isOverdue ? 'text-red-650' : 'text-slate-400'}`}>
                                    Due: {format(new Date(rem.due_at), 'MMM d, h:mm a')}
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-slate-400 text-xs">
                          <CheckCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                          <p>All reminders completed!</p>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => navigate('/dashboard/reminders')}
                      className="w-full text-center py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold rounded-xl transition text-[11px] uppercase tracking-wide border border-slate-100 mt-4 cursor-pointer"
                    >
                      Manage Timeline Reminders
                    </button>
                  </div>

                  {/* Right segment (Recent Interactions / Activity Feed widget) (occupies 3/5 columns) */}
                  <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-100 p-6 shadow-xs flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-center border-b border-slate-50 pb-3 mb-4">
                        <h3 className="text-xs font-bold uppercase text-slate-500 tracking-wider font-mono">Recent Activity Log Feed</h3>
                        <span className="text-[10px] text-slate-400 font-mono">Last 10 Actions</span>
                      </div>

                      {isInteractionsLoading ? (
                        <div className="flex justify-center py-8">
                          <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
                        </div>
                      ) : recentInteractions && recentInteractions.length > 0 ? (
                        <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1 text-xs">
                          {recentInteractions.map((act) => (
                            <div key={act.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-start gap-2.5">
                              <div className="p-1.5 bg-white border border-slate-200 rounded-lg shrink-0 mt-0.5">
                                {getInteractionIcon(act.type)}
                              </div>

                              <div className="leading-tight flex-1 min-w-0">
                                <div className="flex justify-between gap-2">
                                  <span className="font-extrabold text-slate-900 block truncate">
                                    {act.clients?.full_name || 'Client'}
                                  </span>
                                  <span className="text-[9px] font-mono text-slate-400 shrink-0">
                                    {format(new Date(act.occurred_at), 'MMM d, h:mm a')}
                                  </span>
                                </div>
                                <p className="text-slate-655 font-sans mt-1 text-[11px] leading-relaxed line-clamp-2">
                                  {act.summary}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-10 text-slate-400 text-xs">
                          <p>No activity records logged in user databases yet.</p>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => navigate('/dashboard/clients')}
                      className="w-full text-center py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition text-[11px] uppercase tracking-wide mt-4 cursor-pointer"
                    >
                      Access CRM Client Files
                    </button>
                  </div>

                </div>

                {/* Immediate actions buttons block */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-6">
                  <h3 className="text-xs font-bold uppercase text-slate-500 tracking-wider font-mono mb-4">Quick Shortcuts Desk</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div 
                      onClick={() => navigate('/dashboard/properties/new')}
                      className="p-5 border border-slate-100 rounded-2xl hover:bg-slate-50 cursor-pointer transition group"
                    >
                      <h4 className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition flex items-center justify-between">
                        List Property <Plus className="w-3.5 h-3.5 text-blue-600" />
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-1 lines-clamp-2 leading-relaxed">
                        Establish new listings configurations (apartments, residential houses, or vacant lands).
                      </p>
                    </div>
                    <div 
                      onClick={() => navigate('/dashboard/clients/new')}
                      className="p-5 border border-slate-100 rounded-2xl hover:bg-slate-50 cursor-pointer transition group"
                    >
                      <h4 className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition flex items-center justify-between">
                        Add Customer <Plus className="w-3.5 h-3.5 text-blue-600" />
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-1 lines-clamp-2 leading-relaxed">
                        Insert contact records details, lead qualifiers, preferred roles and source records.
                      </p>
                    </div>
                    <div 
                      onClick={() => navigate('/dashboard/inquiries')}
                      className="p-5 border border-slate-100 rounded-2xl hover:bg-slate-50 cursor-pointer transition group"
                    >
                      <h4 className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition flex items-center justify-between">
                        Review Leads <Plus className="w-3.5 h-3.5 text-blue-600" />
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-1 lines-clamp-2 leading-relaxed">
                        Verify incoming portal responses. Set quick answers, or convert inquirers to profiles.
                      </p>
                    </div>
                  </div>
                </div>

              </div>
            } 
          />

          {/* Core Properties routing */}
          <Route path="properties" element={<AgentPropertiesList />} />
          <Route path="properties/new" element={<AgentPropertyForm />} />
          <Route path="properties/:id/edit" element={<AgentPropertyForm isEdit />} />

          {/* Routing for CRM Clients details */}
          <Route path="clients" element={<ClientsList />} />
          <Route path="clients/new" element={<ClientNew />} />
          <Route path="clients/:id" element={<ClientDetail />} />

          {/* Task management calendar */}
          <Route path="reminders" element={<RemindersList />} />

          {/* Lead inbox responses */}
          <Route path="inquiries" element={<InquiriesList />} />

          {/* Visual reports and tracking stats */}
          <Route path="reports" element={<AgentReports />} />

          {/* Global account parameters settings */}
          <Route path="settings" element={<UserSettings />} />

        </Routes>
      </main>
    </div>
  );
};

export default AgentDashboard;

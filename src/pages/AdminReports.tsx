import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { eachDayOfInterval, subDays, format, parseISO } from 'date-fns';
import { LoadingSpinner, EmptyState } from '../components/common/FeedbackStates';
import { formatDateString } from '../lib/format';
import { BarChart3, TrendingUp, Building2, MessageSquare, Award, PieChartIcon } from 'lucide-react';

export const AdminReports: React.FC = () => {
  const { data: adminStats, isLoading, error } = useQuery({
    queryKey: ['admin-global-reports'],
    queryFn: async () => {
      // 1. Fetch all properties
      const { data: properties, error: propertiesError } = await supabase
        .from('properties')
        .select(`
          id,
          agent_id,
          profiles(full_name, email)
        `);

      if (propertiesError) throw propertiesError;

      // 2. Fetch all inquiries
      const { data: inquiries, error: inquiriesError } = await supabase
        .from('inquiries')
        .select('id, created_at');

      if (inquiriesError) throw inquiriesError;

      // 3. Fetch all profiles to list agents
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, email, role');

      if (profilesError) throw profilesError;

      // --- AGGREGATION 1: Agents ranked by listing count ---
      // We will group properties by agent_id and filter profiles with role = 'agent' or 'admin'
      const brokerListingCounts: Record<string, number> = {};
      (properties || []).forEach(p => {
        if (p.agent_id) {
          brokerListingCounts[p.agent_id] = (brokerListingCounts[p.agent_id] || 0) + 1;
        }
      });

      const agentsRank = (profiles || [])
        .filter(u => u.role === 'agent' || u.role === 'admin')
        .map(u => ({
          id: u.id,
          full_name: u.full_name,
          email: u.email || 'broker@buildproconnect.com',
          listingsCount: brokerListingCounts[u.id] || 0
        }))
        .sort((a, b) => b.listingsCount - a.listingsCount);

      // --- AGGREGATION 2: Inquiries per day for last 30 days ---
      const now = new Date();
      const last30Days = eachDayOfInterval({
        start: subDays(now, 29),
        end: now
      });

      // Map day keys for fast lookup
      const inqsPerDayMap: Record<string, number> = {};
      last30Days.forEach(day => {
        const dayKey = format(day, 'yyyy-MM-dd');
        inqsPerDayMap[dayKey] = 0;
      });

      (inquiries || []).forEach(inq => {
        if (inq.created_at) {
          const dayKey = format(parseISO(inq.created_at), 'yyyy-MM-dd');
          if (inqsPerDayMap[dayKey] !== undefined) {
            inqsPerDayMap[dayKey] += 1;
          }
        }
      });

      const inquiriesHistory = last30Days.map(day => {
        const key = format(day, 'yyyy-MM-dd');
        return {
          date: format(day, 'MMM d'),
          dateFull: key,
          count: inqsPerDayMap[key] || 0
        };
      });

      return {
        totalProperties: properties?.length || 0,
        totalInquiries: inquiries?.length || 0,
        agentsRank,
        inquiriesHistory
      };
    }
  });

  if (isLoading) {
    return <LoadingSpinner message="Evaluating platform-wide transaction metadata..." fullPage />;
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 text-red-700 rounded-2xl">
        <p className="text-xs font-bold font-mono">Error syncing admin analytical tables. Please ensure RLS bypass or schema exists.</p>
      </div>
    );
  }

  const reports = adminStats || {
    totalProperties: 0,
    totalInquiries: 0,
    agentsRank: [],
    inquiriesHistory: []
  };

  const hasProperties = reports.totalProperties > 0;

  return (
    <div className="space-y-8 font-sans max-w-7xl mx-auto pb-12 animate-in fade-in duration-200" id="admin-reports-view">
      {/* Metrics board */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white px-6 py-5 rounded-2xl border border-slate-150/80 shadow-xs flex justify-between items-center">
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-400 font-mono tracking-wider">Total Platform-wide Listings</p>
            <p className="text-2xl font-extrabold text-slate-900 mt-1">{reports.totalProperties}</p>
          </div>
          <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl">
            <Building2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white px-6 py-5 rounded-2xl border border-slate-150/80 shadow-xs flex justify-between items-center">
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-400 font-mono tracking-wider">Total Portal inquiries</p>
            <p className="text-2xl font-extrabold text-slate-900 mt-1">{reports.totalInquiries}</p>
          </div>
          <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl">
            <MessageSquare className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 30 Day inquiries Timeline (LineChart - Recharts) */}
      <div className="bg-white p-6 rounded-2xl border border-slate-150/80 shadow-xs">
        <div className="mb-4">
          <h3 className="text-xs font-bold uppercase text-slate-500 tracking-wider font-mono">Inquiries Timeline Tracker</h3>
          <p className="text-slate-400 text-[11px] mt-0.5">Application inquires generated per day over the previous 30 calendar days window.</p>
        </div>
        <div className="h-64">
          {reports.inquiriesHistory.some(d => d.count > 0) ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={reports.inquiriesHistory}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} tickLine={false} />
                <YAxis allowDecimals={false} stroke="#94a3b8" fontSize={10} tickLine={false} />
                <Tooltip contentStyle={{ background: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff' }} />
                <Line 
                  type="monotone" 
                  dataKey="count" 
                  stroke="#2563eb" 
                  strokeWidth={2.5} 
                  activeDot={{ r: 6 }} 
                  name="Daily Inquiries" 
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-slate-400 text-xs">
              No daily traffic history generated in the last 30 days.
            </div>
          )}
        </div>
      </div>

      {/* Ranking of agents based on active lists count */}
      <div className="bg-white rounded-2xl border border-slate-150/80 shadow-xs overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <div>
            <h3 className="text-xs font-bold uppercase text-slate-500 tracking-wider font-mono">Active Agent Rankings</h3>
            <p className="text-slate-400 text-[11px] mt-0.5">Brokers, agents, and administrators organized descending by total properties publishing count.</p>
          </div>
          <div className="p-2 bg-slate-50 rounded-lg text-slate-400">
            <Award className="w-5 h-5 text-amber-500" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/50 text-slate-500 font-mono border-b border-slate-100">
                <th className="py-3 px-6 font-bold">Rank</th>
                <th className="py-3 px-6 font-bold">Broker Name</th>
                <th className="py-3 px-6 font-bold">Email</th>
                <th className="py-3 px-6 font-bold text-right">Published Listings</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {reports.agentsRank.length > 0 ? (
                reports.agentsRank.map((agent, index) => (
                  <tr key={agent.id} className="hover:bg-slate-50/40 transition">
                    <td className="py-4 px-6 font-mono font-bold text-slate-400">
                      #{index + 1}
                    </td>
                    <td className="py-4 px-6 font-extrabold text-slate-900 flex items-center gap-2">
                      {agent.full_name}
                      {index === 0 && agent.listingsCount > 0 && (
                        <span className="text-[9px] bg-amber-50 text-amber-600 font-sans font-bold border border-amber-100 rounded px-1.5 py-0.5 uppercase tracking-wide">
                          Top Broker
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-slate-500 font-mono">
                      {agent.email}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <span className="inline-block px-3 py-1 bg-blue-50 text-blue-600 font-black font-mono rounded-full text-xs">
                        {agent.listingsCount}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-slate-400">
                    No active agents or system brokers registered.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

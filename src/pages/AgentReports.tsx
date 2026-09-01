import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell 
} from 'recharts';
import { startOfWeek, format, parseISO } from 'date-fns';
import { LoadingSpinner, EmptyState } from '../shared/components/FeedbackStates';
import { formatDateString } from '../shared/utils/format';
import { TrendingUp, FileText, BarChart3, PieChartIcon, ArrowRight, HelpCircle } from 'lucide-react';

export const AgentReports: React.FC = () => {
  const { user } = useAuth();
  const userId = user?.id;

  // 1 & 4. Fetch inquiries and properties
  const { data: reportData, isLoading, error } = useQuery({
    queryKey: ['agent-reports', userId],
    queryFn: async () => {
      if (!userId) return null;

      // Fetch all properties owned by this agent
      const { data: properties, error: propertiesError } = await supabase
        .from('properties')
        .select('id, title, location_area, status')
        .eq('agent_id', userId);

      if (propertiesError) throw propertiesError;

      // Fetch all client pipeline information
      const { data: clients, error: clientsError } = await supabase
        .from('clients')
        .select('id, status')
        .eq('agent_id', userId);

      if (clientsError) throw clientsError;

      // Fetch all inquiries on property listings that belong to this agent
      const propertyIds = (properties || []).map(p => p.id);
      
      let inquiries: any[] = [];
      if (propertyIds.length > 0) {
        const { data: inqs, error: inqsError } = await supabase
          .from('inquiries')
          .select('id, property_id, created_at')
          .in('property_id', propertyIds);
        
        if (inqsError) throw inqsError;
        inquiries = inqs || [];
      }

      // --- AGGREGATION 1: Inquiries per week ---
      // We will group inquiries by their start of week date
      const weeklyInqMap: Record<string, number> = {};
      inquiries.forEach(inq => {
        if (!inq.created_at) return;
        const dateObj = parseISO(inq.created_at);
        const weekStartObj = startOfWeek(dateObj, { weekStartsOn: 1 }); // Monday start
        const weekKey = weekStartObj.toISOString(); // keep unique iso-datetime representation
        weeklyInqMap[weekKey] = (weeklyInqMap[weekKey] || 0) + 1;
      });

      // Format weekly counts and slice top 8 limit (chronological sorted, and descending)
      const inquiriesPerWeek = Object.entries(weeklyInqMap)
        .map(([weekStr, count]) => ({
          weekRaw: new Date(weekStr),
          week: format(new Date(weekStr), 'MMM d'),
          count
        }))
        .sort((a, b) => b.weekRaw.getTime() - a.weekRaw.getTime()) // DESC LIMIT 8
        .slice(0, 8)
        .reverse(); // Reverse back to chronological order for beautiful left-to-right charting

      // --- AGGREGATION 2: Property status breakdown ---
      const statusMap: Record<string, number> = {
        available: 0,
        rented: 0,
        sold: 0,
        archived: 0
      };
      (properties || []).forEach(p => {
        statusMap[p.status] = (statusMap[p.status] || 0) + 1;
      });
      const propertyBreakdown = Object.entries(statusMap).map(([status, value]) => ({
        name: status.toUpperCase(),
        value,
        id: status
      })).filter(x => x.value > 0);

      // --- AGGREGATION 3: Client pipeline ---
      // Status keys from database crm
      const pipelineMap: Record<string, number> = {
        lead: 0,
        active: 0,
        closed: 0,
        inactive: 0
      };
      (clients || []).forEach(c => {
        pipelineMap[c.status] = (pipelineMap[c.status] || 0) + 1;
      });
      const clientPipelineData = Object.entries(pipelineMap).map(([status, value]) => ({
        status: status.charAt(0).toUpperCase() + status.slice(1),
        count: value
      }));

      // --- AGGREGATION 4: Top 5 most-inquired properties ---
      const propertyInqsMap: Record<string, { count: number; lastAt: string | null }> = {};
      
      // Initialize maps
      (properties || []).forEach(p => {
        propertyInqsMap[p.id] = { count: 0, lastAt: null };
      });

      inquiries.forEach(inq => {
        const entry = propertyInqsMap[inq.property_id];
        if (entry) {
          entry.count += 1;
          if (!entry.lastAt || new Date(inq.created_at) > new Date(entry.lastAt)) {
            entry.lastAt = inq.created_at;
          }
        }
      });

      const topProperties = (properties || [])
        .map(p => {
          const stats = propertyInqsMap[p.id] || { count: 0, lastAt: null };
          return {
            title: p.title,
            location_area: p.location_area,
            inquiry_count: stats.count,
            last_inquiry: stats.lastAt
          };
        })
        .sort((a, b) => b.inquiry_count - a.inquiry_count)
        .slice(0, 5);

      return {
        inquiriesPerWeek,
        propertyBreakdown,
        clientPipelineData,
        topProperties,
        totalProperties: properties?.length || 0,
        totalClients: clients?.length || 0,
        totalInquiries: inquiries?.length || 0
      };
    },
    enabled: !!userId,
  });

  const COLORS: Record<string, string> = {
    available: '#10b981', // green-500
    rented: '#eab308',    // yellow-500
    sold: '#64748b',      // slate-500/gray
    archived: '#ef4444'   // red-500
  };

  if (isLoading) {
    return <LoadingSpinner message="Assembling real-time database analytics..." fullPage />;
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 text-red-700 rounded-2xl flex items-center gap-3">
        <span>Failed to load reports. Please verify Supabase schemas connectivity.</span>
      </div>
    );
  }

  const reports = reportData || {
    inquiriesPerWeek: [],
    propertyBreakdown: [],
    clientPipelineData: [],
    topProperties: [],
    totalProperties: 0,
    totalClients: 0,
    totalInquiries: 0
  };

  const hasProperties = reports.totalProperties > 0;

  return (
    <div className="space-y-8 font-sans max-w-7xl mx-auto pb-12 animate-in fade-in duration-200" id="agent-reports-view">
      {/* Header section with metrics highlights */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-600" /> Executive Analytics & Reports
          </h1>
          <p className="text-slate-500 text-xs mt-1">
            Visual statistics, pipeline breakdowns, and active lead metrics in Ghana real estate.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="bg-slate-100 text-slate-700 px-3 py-1.5 rounded-xl font-bold">
            ⚡ Synced Live
          </span>
        </div>
      </div>

      {hasProperties ? (
        <>
          {/* Quick Metrics highlight cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="bg-white px-6 py-5 rounded-2xl border border-slate-150/80 shadow-xs flex justify-between items-center">
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400 font-mono tracking-wider">Total Handled Listings</p>
                <p className="text-2xl font-extrabold text-slate-900 mt-1">{reports.totalProperties}</p>
              </div>
              <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                <FileText className="w-5 h-5" />
              </div>
            </div>
            <div className="bg-white px-6 py-5 rounded-2xl border border-slate-150/80 shadow-xs flex justify-between items-center">
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400 font-mono tracking-wider">CRM Database Contacts</p>
                <p className="text-2xl font-extrabold text-slate-900 mt-1">{reports.totalClients}</p>
              </div>
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>
            <div className="bg-white px-6 py-5 rounded-2xl border border-slate-150/80 shadow-xs flex justify-between items-center">
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400 font-mono tracking-wider">Total Portal Inquiries</p>
                <p className="text-2xl font-extrabold text-slate-900 mt-1">{reports.totalInquiries}</p>
              </div>
              <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
                <BarChart3 className="w-5 h-5" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart 1: Inquiries per week */}
            <div className="bg-white p-6 rounded-2xl border border-slate-150/80 shadow-xs">
              <div className="mb-4">
                <h3 className="text-xs font-bold uppercase text-slate-500 tracking-wider font-mono">Inquiries Received per Week</h3>
                <p className="text-slate-400 text-[11px] mt-0.5">Chronological summary of client interest across the last 8 weeks.</p>
              </div>
              <div className="h-64">
                {reports.inquiriesPerWeek.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={reports.inquiriesPerWeek}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="week" stroke="#94a3b8" fontSize={11} tickLine={false} />
                      <YAxis allowDecimals={false} stroke="#94a3b8" fontSize={11} tickLine={false} />
                      <Tooltip 
                        contentStyle={{ background: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff' }} 
                        labelClassName="text-slate-350 text-sans font-bold"
                      />
                      <Bar dataKey="count" fill="#2563eb" radius={[6, 6, 0, 0]} name="Inquiries" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-400 text-xs">
                    No inquiry timestamp data to graph.
                  </div>
                )}
              </div>
            </div>

            {/* Chart 2: Property status breakdown */}
            <div className="bg-white p-6 rounded-2xl border border-slate-150/80 shadow-xs">
              <div className="mb-4 flex justify-between items-center">
                <div>
                  <h3 className="text-xs font-bold uppercase text-slate-500 tracking-wider font-mono">Portfolio Status Allocation</h3>
                  <p className="text-slate-400 text-[11px] mt-0.5">Ratio of available, rented, sold, and archived listings.</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 items-center">
                <div className="h-56 sm:col-span-3">
                  {reports.propertyBreakdown.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={reports.propertyBreakdown}
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {reports.propertyBreakdown.map((entry) => (
                            <Cell key={`cell-${entry.id}`} fill={COLORS[entry.id] || '#cbd5e1'} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ background: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-slate-400 text-xs">
                      No status data available.
                    </div>
                  )}
                </div>
                <div className="sm:col-span-2 space-y-2.5 text-xs text-slate-700">
                  {['available', 'rented', 'sold', 'archived'].map((status) => {
                    const matched = reports.propertyBreakdown.find(p => p.id === status);
                    const val = matched ? matched.value : 0;
                    return (
                      <div key={status} className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: COLORS[status] }} />
                        <span className="capitalize font-medium text-slate-600">{status}:</span>
                        <span className="font-extrabold text-slate-950 ml-auto">{val}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Chart 3: Client Pipeline */}
            <div className="bg-white p-6 rounded-2xl border border-slate-150/80 shadow-xs lg:col-span-2">
              <div className="mb-4">
                <h3 className="text-xs font-bold uppercase text-slate-500 tracking-wider font-mono">CRM Pipeline Distribution</h3>
                <p className="text-slate-400 text-[11px] mt-0.5">Counts of customer accounts grouped by current status (lead, active, closed, inactive).</p>
              </div>
              <div className="h-64">
                {reports.clientPipelineData.some(d => d.count > 0) ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={reports.clientPipelineData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="status" stroke="#94a3b8" fontSize={11} tickLine={false} />
                      <YAxis allowDecimals={false} stroke="#94a3b8" fontSize={11} tickLine={false} />
                      <Tooltip contentStyle={{ background: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff' }} />
                      <Bar dataKey="count" fill="#10b981" radius={[6, 6, 0, 0]} name="Clients Count" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-400 text-xs">
                    Please log client records to display pipeline distribution.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Table: Top 5 most-inquired properties */}
          <div className="bg-white rounded-2xl border border-slate-150/80 shadow-xs overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <div>
                <h3 className="text-xs font-bold uppercase text-slate-100 mt-2 font-mono" style={{ color: '#64748b' }}>Top 5 Most-Inquired Properties</h3>
                <p className="text-slate-400 text-[11px] mt-0.5">Listings generating highest inquirer traffic and corresponding chronological last interaction date.</p>
              </div>
              <span className="text-[10px] bg-slate-100 text-slate-600 font-semibold px-2.5 py-1 rounded-xl">
                Ordered by Traffic Count
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 text-slate-500 font-mono border-b border-slate-100">
                    <th className="py-3 px-6 font-bold">Property Title</th>
                    <th className="py-3 px-6 font-bold">Location Area</th>
                    <th className="py-3 px-6 font-bold text-center">Inquiry Count</th>
                    <th className="py-3 px-6 font-bold text-right">Last Inquiry Received</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {reports.topProperties.length > 0 ? (
                    reports.topProperties.map((prop, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/40 transition">
                        <td className="py-3 px-6 font-extrabold text-slate-900">{prop.title}</td>
                        <td className="py-3 px-6 text-slate-500">{prop.location_area}</td>
                        <td className="py-3 px-6 text-center">
                          <span className="inline-block px-2.5 py-1 rounded-full bg-blue-50 text-blue-600 font-extrabold font-mono text-[11px]">
                            {prop.inquiry_count}
                          </span>
                        </td>
                        <td className="py-3 px-6 text-right text-slate-500 font-mono">
                          {prop.last_inquiry ? formatDateString(prop.last_inquiry) : 'Never'}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-slate-400">
                        No inquiries recorded yet for listings.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <EmptyState 
          title="Listing Inventory Empty" 
          description="In order to display visual tracking reports and traffic funnels, you must first publish property listings in the BuildProConnect database."
          icon={<HelpCircle className="w-7 h-7 text-slate-400" />}
        />
      )}
    </div>
  );
};

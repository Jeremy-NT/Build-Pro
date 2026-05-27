import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Plus, User, Phone, Mail, Calendar, AlertTriangle, Loader2 } from 'lucide-react';

interface Client {
  id: string;
  agent_id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  client_type: 'buyer' | 'renter' | 'seller' | 'investor' | null;
  status: 'lead' | 'active' | 'closed' | 'inactive';
  notes: string | null;
  source: string | null;
  created_at: string;
}

export const ClientsList: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Fetch clients for logged in Agent
  const { data: clients, isLoading, isError } = useQuery<Client[]>({
    queryKey: ['agentClients'],
    queryFn: async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData?.session?.user?.id;
      if (!userId) throw new Error('Unauthenticated user session');

      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('agent_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as Client[];
    }
  });

  // Filter list
  const filteredClients = (clients || []).filter((client) => {
    const matchesSearch = client.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (client.email || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || client.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'lead':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'closed':
        return 'bg-slate-100 text-slate-700 border-slate-300';
      case 'inactive':
        return 'bg-red-50 text-red-600 border-red-200';
      default:
        return 'bg-slate-50 text-slate-600 border-slate-200';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight font-sans">
            CRM Clients & Leads
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Build closer relationships, catalog client preferences, log interaction diaries, and set task reminders.
          </p>
        </div>
        <Link
          to="/dashboard/clients/new"
          className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow shadow-blue-500/20 cursor-pointer self-start sm:self-auto uppercase tracking-wide"
        >
          <Plus className="w-4 h-4" />
          Add Client
        </Link>
      </div>

      {/* Filter and search bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search clients by name or email address..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-xs font-sans pl-9 pr-4 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
          />
        </div>

        <div className="w-full md:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full md:w-auto py-2 pl-3 pr-8 border border-slate-200 rounded-xl font-sans text-xs font-semibold text-slate-700 bg-white"
          >
            <option value="all">Any Status</option>
            <option value="lead">Lead</option>
            <option value="active">Active</option>
            <option value="closed">Closed</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white border border-slate-100 rounded-2xl">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          <p className="mt-3 text-slate-500 text-xs font-sans">Compiling clients index...</p>
        </div>
      ) : isError ? (
        <div className="p-8 text-center bg-white border border-slate-100 rounded-2xl">
          <AlertTriangle className="w-10 h-10 text-red-500 mx-auto mb-2" />
          <p className="text-slate-800 text-xs font-bold font-sans">Error reading clients</p>
          <p className="text-slate-500 text-[11px] mt-0.5">Could not authenticate metadata or load CRM records.</p>
        </div>
      ) : filteredClients.length === 0 ? (
        <div className="text-center py-16 bg-white border border-slate-100 rounded-2xl shadow-sm">
          <User className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-800">No matching clients found</h3>
          <p className="text-xs text-slate-500 max-w-xs mx-auto mt-1 mb-5">
            You do not have any CRM contacts conforming to these filters. Initialize a record today.
          </p>
          <Link
            to="/dashboard/clients/new"
            className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold"
          >
            Create Client Profile
          </Link>
        </div>
      ) : (
        <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden text-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-slate-650">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-100 font-mono font-bold text-slate-600 uppercase tracking-wider text-[10px]">
                  <th className="py-3.5 px-5">Client Name</th>
                  <th className="py-3.5 px-4">Preference Type</th>
                  <th className="py-3.5 px-4">Contact Coordinates</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Source</th>
                  <th className="py-3.5 px-4">Created At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {filteredClients.map((client) => (
                  <tr 
                    key={client.id}
                    onClick={() => navigate(`/dashboard/clients/${client.id}`)}
                    className="hover:bg-slate-50/75 transition cursor-pointer"
                  >
                    {/* Name */}
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-50 border border-blue-100 text-blue-600 font-mono font-bold flex items-center justify-center uppercase shrink-0">
                          {client.full_name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-extrabold text-slate-900">{client.full_name}</p>
                          <span className="text-[10px] text-slate-400 capitalize">CRM ID: {client.id.substring(0, 8)}</span>
                        </div>
                      </div>
                    </td>

                    {/* Preference Type */}
                    <td className="py-4 px-4 capitalize font-semibold text-slate-700">
                      {client.client_type || 'unspecified'}
                    </td>

                    {/* Contact Coordinates */}
                    <td className="py-4 px-4">
                      <div className="space-y-0.5">
                        {client.email && (
                          <div className="flex items-center gap-1.5 text-slate-500">
                            <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="truncate max-w-[200px]">{client.email}</span>
                          </div>
                        )}
                        {client.phone && (
                          <div className="flex items-center gap-1.5 text-slate-500">
                            <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>{client.phone}</span>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Status badge */}
                    <td className="py-4 px-4">
                      <span className={`px-2.5 py-0.5 text-[9px] font-bold uppercase rounded-md border ${getStatusStyle(client.status)}`}>
                        {client.status}
                      </span>
                    </td>

                    {/* Source */}
                    <td className="py-4 px-4 capitalize font-medium text-slate-600">
                      {client.source || 'Direct'}
                    </td>

                    {/* Created date */}
                    <td className="py-4 px-4 font-mono text-[10px] text-slate-450">
                      {new Date(client.created_at).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

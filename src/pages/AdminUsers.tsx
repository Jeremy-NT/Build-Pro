import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { LoadingSpinner, EmptyState } from '../shared/components/FeedbackStates';
import { formatDateString } from '../shared/utils/format';
import { toast } from 'react-hot-toast';
import { 
  Users, UserCheck, Shield, ToggleLeft, ToggleRight, Loader2, Search, Filter, Ban, CheckCircle 
} from 'lucide-react';

export const AdminUsers: React.FC = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  // Fetch all profiles from public schema
  const { data: users, isLoading, error } = useQuery<any[]>({
    queryKey: ['admin-profiles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    }
  });

  // Role toggle mutation
  const toggleRoleMutation = useMutation({
    mutationFn: async ({ id, currentRole }: { id: string; currentRole: string }) => {
      const nextRole = currentRole === 'client' ? 'agent' : 'client';
      const { error } = await supabase
        .from('profiles')
        .update({ role: nextRole })
        .eq('id', id);

      if (error) throw error;
      return { id, nextRole };
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['admin-profiles'], (old: any[] | undefined) => {
        if (!old) return old;
        return old.map(u => u.id === data.id ? { ...u, role: data.nextRole } : u);
      });
      toast.success('User updated role successfully');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to toggle user role status.');
    }
  });

  // Disabled state toggle mutation
  const toggleDisabledMutation = useMutation({
    mutationFn: async ({ id, currentDisabled }: { id: string; currentDisabled: boolean }) => {
      const nextDisabled = !currentDisabled;
      const { error } = await supabase
        .from('profiles')
        .update({ disabled: nextDisabled })
        .eq('id', id);

      if (error) throw error;
      return { id, nextDisabled };
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['admin-profiles'], (old: any[] | undefined) => {
        if (!old) return old;
        return old.map(u => u.id === data.id ? { ...u, disabled: data.nextDisabled } : u);
      });
      const message = data.nextDisabled 
        ? 'Account disabled successfully.' 
        : 'Account enabled successfully.';
      toast.success(message);
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to toggle account disabled status.');
    }
  });

  if (isLoading) {
    return <LoadingSpinner message="Retrieving secure account directories..." fullPage />;
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-250 text-red-700 rounded-2xl">
        <p className="text-xs font-bold font-mono">Error querying user profiles database. Ensure SELECT privilege on profiles.</p>
      </div>
    );
  }

  // Filter listings client side based on matching keyword
  const filteredUsers = (users || []).filter(u => {
    const matchesSearch = 
      (u.full_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.phone || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    if (roleFilter === 'all') return matchesSearch;
    return matchesSearch && u.role === roleFilter;
  });

  return (
    <div className="space-y-6 font-sans max-w-7xl mx-auto pb-12 animate-in fade-in duration-200" id="admin-usercontrol-panel">
      {/* Search and filter controls panel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-150/80 shadow-xs">
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            placeholder="Search accounts name, phone, or emails..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-sans text-slate-800 focus:outline-hidden focus:border-blue-500 transition"
          />
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="py-1.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-hidden cursor-pointer"
          >
            <option value="all">All Roles</option>
            <option value="admin">Administrator</option>
            <option value="agent">Broker / Agent</option>
            <option value="client">Client Portal Buyer</option>
          </select>
        </div>
      </div>

      {filteredUsers.length > 0 ? (
        <div className="bg-white rounded-2xl border border-slate-150/80 shadow-xs overflow-hidden">
          <div className="p-4 bg-slate-50/50 border-b border-slate-100 flex justify-between items-center">
            <span className="text-[10px] uppercase font-black text-slate-400 font-mono tracking-wider">
              Profile Indexes Found ({filteredUsers.length})
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/20 text-slate-500 font-mono border-b border-slate-100">
                  <th className="py-3 px-6 font-semibold">User Details</th>
                  <th className="py-3 px-6 font-semibold">Account Role</th>
                  <th className="py-3 px-6 font-semibold">Registered At</th>
                  <th className="py-3 px-6 font-semibold text-center">Disable Access</th>
                  <th className="py-3 px-6 font-semibold text-right">Role Toggle</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map((u) => {
                  const isPendingToggle = toggleRoleMutation.isPending && toggleRoleMutation.variables?.id === u.id;
                  const isPendingDisable = toggleDisabledMutation.isPending && toggleDisabledMutation.variables?.id === u.id;
                  
                  return (
                    <tr key={u.id} className={`hover:bg-slate-50/30 transition ${u.disabled ? 'bg-red-50/10' : ''}`}>
                      <td className="py-3 px-6">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs font-mono select-none ${
                            u.disabled ? 'bg-red-100 text-red-650' : 'bg-slate-100 text-slate-800'
                          }`}>
                            {u.avatar_url ? (
                              <img 
                                src={u.avatar_url} 
                                alt={u.full_name} 
                                className="w-full h-full rounded-full object-cover" 
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              (u.full_name || 'U').charAt(0).toUpperCase()
                            )}
                          </div>
                          <div>
                            <p className="font-extrabold text-slate-900 leading-snug flex items-center gap-2">
                              {u.full_name || 'Anonymous User'} 
                              {u.disabled && (
                                <span className="text-[9px] font-mono font-bold uppercase shrink-0 bg-red-100 text-red-650 tracking-wider rounded px-1.5 py-0.5">
                                  Disabled
                                </span>
                              )}
                            </p>
                            <p className="text-[10px] text-slate-400 mt-0.5 font-mono">
                              {u.email || u.phone || 'client-user@buildproconnect.com'}
                            </p>
                          </div>
                        </div>
                      </td>
                      
                      <td className="py-3 px-6">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full font-bold text-[10px] tracking-wider uppercase ${
                          u.role === 'admin' 
                            ? 'bg-red-50 text-red-600' 
                            : u.role === 'agent'
                            ? 'bg-blue-50 text-blue-600'
                            : 'bg-emerald-50 text-emerald-600'
                        }`}>
                          {u.role}
                        </span>
                      </td>

                      <td className="py-3 px-6 text-slate-500 font-mono">
                        {formatDateString(u.created_at)}
                      </td>

                      <td className="py-3 px-6 text-center">
                        <button
                          onClick={() => toggleDisabledMutation.mutate({ id: u.id, currentDisabled: !!u.disabled })}
                          disabled={isPendingDisable || u.role === 'admin'}
                          title={u.disabled ? 'Enable Account' : 'Disable Account'}
                          className={`p-1.5 rounded-lg border transition duration-150 inline-flex items-center ${
                            u.role === 'admin' 
                              ? 'opacity-40 cursor-not-allowed border-slate-100 text-slate-300' 
                              : u.disabled 
                              ? 'bg-red-50 border-red-200 text-red-600 hover:bg-red-100 cursor-pointer' 
                              : 'bg-slate-50 border-slate-200 text-slate-400 hover:text-red-550 cursor-pointer'
                          }`}
                        >
                          {isPendingDisable ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : u.disabled ? (
                            <Ban className="w-3.5 h-3.5" />
                          ) : (
                            <UserCheck className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </td>

                      <td className="py-3 px-6 text-right">
                        {u.role !== 'admin' ? (
                          <button
                            onClick={() => toggleRoleMutation.mutate({ id: u.id, currentRole: u.role })}
                            disabled={isPendingToggle}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[10.5px] font-extrabold border border-slate-200 hover:border-blue-500 rounded-xl bg-white hover:bg-blue-50/50 text-slate-700 transition cursor-pointer disabled:opacity-50 font-mono"
                          >
                            {isPendingToggle ? (
                              <Loader2 className="w-3 animate-spin text-blue-600" />
                            ) : u.role === 'client' ? (
                              <>
                                Promote to Agent <Shield className="w-3 h-3 text-blue-600" />
                              </>
                            ) : (
                              <>
                                Demote to Client <Shield className="w-3 h-3 text-red-600" />
                              </>
                            )}
                          </button>
                        ) : (
                          <span className="text-[10px] font-mono font-bold text-slate-400 pr-3">System Root</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <EmptyState 
          title="No Accounts Located" 
          description="Your current search filter criteria did not matching any profiles inside the secure database module."
          onAction={() => {
            setSearchTerm('');
            setRoleFilter('all');
          }}
          actionLabel="Clear Filter Scope"
        />
      )}
    </div>
  );
};

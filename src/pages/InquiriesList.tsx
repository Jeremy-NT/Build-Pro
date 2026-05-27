import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { 
  Mail, Phone, MessageSquare, AlertTriangle, Loader2, ArrowRight,
  Send, UserPlus, CheckCircle2, Clock, Inbox, Check
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface Inquiry {
  id: string;
  property_id: string;
  client_profile_id: string | null;
  sender_name: string;
  sender_email: string;
  sender_phone: string | null;
  message: string;
  status: 'new' | 'read' | 'responded' | 'closed';
  agent_reply: string | null;
  replied_at: string | null;
  created_at: string;
  properties: {
    id: string;
    title: string;
    agent_id: string;
  } | null;
}

export const InquiriesList: React.FC = () => {
  const { session, profile } = useAuth();
  const userId = session?.user?.id;
  const isAdmin = profile?.role === 'admin';
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Selected Inquiry state for Dialog Popup
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);
  const [replyText, setReplyText] = useState('');

  // Fetch inquiries for Agent properties (or all if admin)
  const { data: inquiries, isLoading, isError } = useQuery<Inquiry[]>({
    queryKey: ['agentInquiries', userId, isAdmin],
    queryFn: async () => {
      if (!userId) throw new Error('Unauthenticated user database context');

      let query = supabase
        .from('inquiries')
        .select(`
          *,
          properties:property_id!inner (
            id,
            title,
            agent_id
          )
        `);

      // If not admin, restrict of course to listings managed by this agent
      if (!isAdmin) {
        query = query.eq('properties.agent_id', userId);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as any[];
    },
    enabled: !!userId,
  });

  // REALTIME SUBSCRIPTION setup
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel('agent-leads-channel')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'inquiries' },
        async (payload) => {
          const newInq = payload.new;
          if (!newInq) return;

          try {
            // Verify if this is on a property owned by the agent
            const { data: prop, error } = await supabase
              .from('properties')
              .select('agent_id, title')
              .eq('id', newInq.property_id)
              .single();

            if (!error && prop) {
              if (prop.agent_id === userId || isAdmin) {
                toast.success(
                  `📬 New inquiry received on "${prop.title}" from ${newInq.sender_name}!`,
                  { duration: 6000, icon: '⚡' }
                );
                queryClient.invalidateQueries({ queryKey: ['agentInquiries'] });
                queryClient.invalidateQueries({ queryKey: ['dashboardKPIs'] });
              }
            }
          } catch (err) {
            console.warn('Realtime event verification error:', err);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, isAdmin, queryClient]);

  // Reply Submit Mutation
  const replyMutation = useMutation({
    mutationFn: async () => {
      if (!selectedInquiry) throw new Error('No inquiry row active');
      const { error } = await supabase
        .from('inquiries')
        .update({
          status: 'responded',
          agent_reply: replyText,
          replied_at: new Date().toISOString()
        })
        .eq('id', selectedInquiry.id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Reply submitted successfully & status marked Responded.');
      const inqId = selectedInquiry?.id;
      setReplyText('');
      setSelectedInquiry(null);
      queryClient.invalidateQueries({ queryKey: ['agentInquiries'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardKPIs'] });
    },
    onError: (err: any) => {
      toast.error(err.message || 'Error occurred while saving reply.');
    }
  });

  // Mark inquiry as Read if it was New when opened
  const markAsReadMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('inquiries')
        .update({ status: 'read' })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agentInquiries'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardKPIs'] });
    }
  });

  const handleRowClick = (inq: Inquiry) => {
    setSelectedInquiry(inq);
    setReplyText(inq.agent_reply || '');
    if (inq.status === 'new') {
      markAsReadMutation.mutate(inq.id);
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'new':
        return 'bg-red-600 text-white font-extrabold shadow-sm shadow-red-500/20 animate-pulse';
      case 'read':
        return 'bg-slate-100 text-slate-800 border-slate-300';
      case 'responded':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'closed':
        return 'bg-slate-200 text-slate-500 border-slate-300';
      default:
        return 'bg-slate-50 text-slate-600';
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div>
        <h2 className="text-xl font-black text-slate-900 tracking-tight font-sans">
          Customer Listings Inquiries
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Review notes and queries sent by portals browsers. Convert prospective inquiries directly to CRM profiles.
        </p>
      </div>

      {/* Main List Table */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white border border-slate-100 rounded-2xl">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          <p className="mt-3 text-slate-500 text-xs font-sans">Loading inquirers databases...</p>
        </div>
      ) : isError ? (
        <div className="p-8 text-center bg-white border border-slate-100 rounded-2xl">
          <AlertTriangle className="w-10 h-10 text-red-500 mx-auto mb-2" />
          <p className="text-slate-800 text-xs font-bold font-sans">Error reading inquiries</p>
          <p className="text-slate-500 text-[11px] mt-0.5">Could not authenticate table relationships or execute PostgreSQL SELECT queries.</p>
        </div>
      ) : inquiries.length === 0 ? (
        <div className="text-center py-16 bg-white border border-slate-100 rounded-2xl shadow-sm text-xs">
          <Inbox className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-800">Inquiry queue clear</h3>
          <p className="text-xs text-slate-500 max-w-xs mx-auto mt-1 leading-normal text-center">
            You do not have any inquiries on your properties. Broadcast listing links to receive raw responses!
          </p>
        </div>
      ) : (
        <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden text-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-slate-650">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-100 font-mono font-bold text-slate-600 uppercase tracking-wider text-[10px]">
                  <th className="py-3.5 px-5">Sender Details</th>
                  <th className="py-3.5 px-4">Subject Property</th>
                  <th className="py-3.5 px-4">Short Message</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Inquiry Received</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {inquiries.map((inq) => (
                  <tr 
                    key={inq.id}
                    onClick={() => handleRowClick(inq)}
                    className="hover:bg-slate-50/75 transition cursor-pointer"
                  >
                    {/* Name block */}
                    <td className="py-4 px-5">
                      <div>
                        <p className="font-extrabold text-slate-900">{inq.sender_name}</p>
                        <span className="text-[10px] text-slate-400 font-semibold">{inq.sender_email}</span>
                      </div>
                    </td>

                    {/* Joined property name */}
                    <td className="py-4 px-4 font-semibold text-slate-800 max-w-[180px] truncate">
                      {inq.properties?.title || 'Unknown Property'}
                    </td>

                    {/* Extrated message */}
                    <td className="py-4 px-4 text-slate-500 max-w-xs truncate">
                      {inq.message}
                    </td>

                    {/* Status Badge */}
                    <td className="py-4 px-4">
                      <span className={`px-2 py-0.5 text-[9px] font-bold uppercase rounded border ${getStatusStyle(inq.status)}`}>
                        {inq.status}
                      </span>
                    </td>

                    {/* Date */}
                    <td className="py-4 px-4 font-mono text-[10px] text-slate-400">
                      {new Date(inq.created_at).toLocaleDateString(undefined, {
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

      {/* REPLY MODAL OVERLAY */}
      {selectedInquiry && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white p-6 max-w-lg w-full rounded-2xl shadow-xl border border-slate-100 text-xs font-sans space-y-5">
            
            <div className="flex border-b border-slate-100 pb-3 justify-between items-start">
              <div>
                <h3 className="text-sm font-black text-slate-900 leading-tight">Inquiry Detail & Reply Desk</h3>
                <span className="block text-[10px] text-slate-450 mt-0.5">ID: {selectedInquiry.id}</span>
              </div>
              <button
                onClick={() => setSelectedInquiry(null)}
                className="text-slate-400 hover:text-slate-900 font-bold"
              >
                ✕
              </button>
            </div>

            {/* Inquirer Details */}
            <div className="grid grid-cols-2 gap-3.5 bg-slate-50 p-3.5 rounded-xl border border-slate-100 font-semibold text-slate-800">
              <div>
                <span className="block text-[9px] font-bold text-slate-400 uppercase">From Sender</span>
                <p>{selectedInquiry.sender_name}</p>
              </div>
              <div>
                <span className="block text-[9px] font-bold text-slate-400 uppercase">Associated Listing</span>
                <p className="truncate">{selectedInquiry.properties?.title || '—'}</p>
              </div>
              <div>
                <span className="block text-[9px] font-bold text-slate-400 uppercase">Email Address</span>
                <p className="text-blue-600 truncate">{selectedInquiry.sender_email}</p>
              </div>
              <div>
                <span className="block text-[9px] font-bold text-slate-400 uppercase">Phone contact</span>
                <p>{selectedInquiry.sender_phone || 'Unspecified'}</p>
              </div>
            </div>

            {/* MESSAGE BODY */}
            <div>
              <span className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Message Query</span>
              <p className="bg-slate-50 p-3 rounded-xl border border-slate-105 text-slate-700 leading-normal font-sans text-[11px] whitespace-normal">
                {selectedInquiry.message}
              </p>
            </div>

            {/* REPLY TEXTAREA */}
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                replyMutation.mutate();
              }}
              className="space-y-4 pt-1"
            >
              <div>
                <label className="block text-[10px] font-bold text-slate-700 mb-1 uppercase tracking-wide">Agent Answer Reply</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Draft your reply or quote guidelines/inspections timings here..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-2">
                {/* Convert to Client trigger link */}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedInquiry(null);
                    // Pass to /dashboard/clients/new as queries
                    navigate(`/dashboard/clients/new?name=${encodeURIComponent(selectedInquiry.sender_name)}&email=${encodeURIComponent(selectedInquiry.sender_email)}&phone=${encodeURIComponent(selectedInquiry.sender_phone || '')}&source=inquiry`);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-2 border border-slate-250 hover:bg-slate-100 rounded-xl text-slate-700 text-[11.5px] font-bold transition justify-center self-start"
                >
                  <UserPlus className="w-4 h-4 text-blue-600" />
                  Convert to Client Profile
                </button>

                <div className="flex gap-2 justify-end self-end sm:self-auto">
                  <button
                    type="button"
                    onClick={() => setSelectedInquiry(null)}
                    className="px-3.5 py-2 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl transition"
                  >
                    Dismiss
                  </button>
                  <button
                    type="submit"
                    disabled={replyMutation.isPending}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow inline-flex items-center gap-1 cursor-pointer tracking-wide uppercase text-[10.5px]"
                  >
                    {replyMutation.isPending ? 'Publishing...' : 'Send Reply'}
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
};

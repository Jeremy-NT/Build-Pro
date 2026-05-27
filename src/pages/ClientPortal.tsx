import React, { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { LoadingSpinner, EmptyState } from '../components/common/FeedbackStates';
import { formatDateTimeString } from '../lib/format';
import { UserSettings } from './UserSettings';
import { 
  Building2, MapPin, Settings, Layout, MessageSquareReply, ArrowUpRight 
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface Inquiry {
  id: string;
  sender_name: string;
  sender_email: string;
  message: string;
  status: string;
  agent_reply?: string;
  replied_at?: string;
  created_at: string;
  properties?: {
    title: string;
    location_city: string;
    location_area: string;
    image_urls?: string[];
  };
}

export const ClientPortal: React.FC = () => {
  const { user, profile } = useAuth();
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'inquiries' | 'settings'>('inquiries');

  const fetchInquiries = async () => {
    try {
      setLoading(true);
      if (!user) return;

      const { data, error } = await supabase
        .from('inquiries')
        .select(`
          id,
          sender_name,
          sender_email,
          message,
          status,
          agent_reply,
          replied_at,
          created_at,
          properties (
            title,
            location_city,
            location_area,
            image_urls
          )
        `)
        .or(`client_profile_id.eq.${user.id},sender_email.eq.${user.email}`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) setInquiries(data as any[]);
    } catch (err: any) {
      console.warn('Inquiry fetch error:', err);
      toast.error('Failed to load your inquiries.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && activeTab === 'inquiries') {
      fetchInquiries();
    }
  }, [user, activeTab]);

  return (
    <div className="bg-slate-50 min-h-screen py-10 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Welcome Header Banner */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl p-6 sm:p-8 shadow-sm relative overflow-hidden">
          <div className="absolute right-0 top-0 bottom-0 opacity-5 flex items-center pr-8 pointer-events-none">
            <Building2 className="w-64 h-64 text-white" />
          </div>
          <div className="relative z-10 max-w-xl">
            <span className="inline-flex items-center px-2.5 py-0.5 text-xs font-medium bg-blue-500/10 text-blue-400 rounded-full border border-blue-500/20">
              Client Workspace
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold mt-3 text-slate-100 tracking-tight">
              Welcome back, {profile?.full_name || 'Home Buyer'}
            </h1>
            <p className="text-slate-400 text-sm mt-1.5 leading-relaxed">
              Track your sent requests, view agent updates, and manage your account options all in one place.
            </p>
          </div>
        </div>

        {/* Tab Selection Switch */}
        <div className="flex border-b border-slate-200 gap-8">
          <button
            onClick={() => setActiveTab('inquiries')}
            className={`pb-4 text-sm font-medium transition flex items-center gap-2 cursor-pointer relative ${
              activeTab === 'inquiries' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Layout className="w-4 h-4" />
            <span>My Inquiries</span>
            {inquiries.length > 0 && (
              <span className="bg-slate-100 text-slate-600 text-xs px-2 py-0.5 rounded-full font-medium ml-1">
                {inquiries.length}
              </span>
            )}
            {activeTab === 'inquiries' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`pb-4 text-sm font-medium transition flex items-center gap-2 cursor-pointer relative ${
              activeTab === 'settings' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Account Settings</span>
            {activeTab === 'settings' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />
            )}
          </button>
        </div>

        {/* Main Content Workspace */}
        <div>
          {activeTab === 'inquiries' ? (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-semibold text-slate-900">Sent Inquiries</h3>
                  <p className="text-slate-500 text-xs mt-0.5">
                    Review and stay updated on the properties you’ve reached out about.
                  </p>
                </div>
                <button 
                  onClick={fetchInquiries}
                  className="text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 px-4 py-2 rounded-xl cursor-pointer transition shadow-sm self-start sm:self-auto"
                >
                  Refresh Feed
                </button>
              </div>

              {loading ? (
                <div className="bg-white rounded-2xl border border-slate-200/60 p-12 shadow-sm">
                  <LoadingSpinner message="Retrieving your inquiries..." />
                </div>
              ) : inquiries.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200/60 p-12 shadow-sm">
                  <EmptyState 
                    title="No inquiries found" 
                    description="You haven't requested information or viewings for any listings yet."
                    onAction={() => window.location.href = '/properties'}
                    actionLabel="Explore Properties"
                  />
                </div>
              ) : (
                <div className="space-y-4">
                  {inquiries.map((inq) => {
                    const firstImg = inq.properties?.image_urls && inq.properties.image_urls.length > 0 
                      ? inq.properties.image_urls[0] 
                      : null;
                    
                    return (
                      <div 
                        key={inq.id} 
                        className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/60 shadow-sm flex flex-col md:flex-row gap-6 items-start"
                      >
                        {/* Property Media Frame */}
                        <div className="w-full md:w-40 h-28 rounded-xl bg-slate-50 border border-slate-100 shrink-0 overflow-hidden relative shadow-inner">
                          {firstImg ? (
                            <img 
                              src={firstImg} 
                              alt={inq.properties?.title} 
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 text-xs p-3">
                              <Building2 className="w-5 h-5 mb-1 text-slate-300" />
                              <span className="text-[10px] text-slate-400 font-medium">No Image Available</span>
                            </div>
                          )}
                        </div>

                        {/* Details Content Context */}
                        <div className="flex-grow space-y-4 w-full">
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                            <div>
                              <h4 className="font-bold text-base text-slate-900 tracking-tight flex items-center gap-1.5 group cursor-pointer">
                                {inq.properties?.title || 'Unknown Property'}
                                <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 opacity-0 group-hover:opacity-100 transition" />
                              </h4>
                              <p className="text-slate-500 text-xs flex items-center gap-1 mt-0.5">
                                <MapPin className="w-3.5 h-3.5 text-slate-400" /> 
                                {inq.properties?.location_area}, {inq.properties?.location_city}
                              </p>
                            </div>
                            
                            {/* Badges Refactored for subtle context */}
                            <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium capitalize self-start ${
                              inq.status === 'new' ? 'bg-blue-50 text-blue-700 border border-blue-100' :
                              inq.status === 'read' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                              inq.status === 'responded' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                              'bg-slate-50 text-slate-600 border border-slate-100'
                            }`}>
                              {inq.status}
                            </span>
                          </div>

                          {/* Client's Original Message Block */}
                          <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-100 space-y-1">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                              Your Message
                            </span>
                            <p className="text-sm text-slate-700 italic">"{inq.message}"</p>
                            <span className="text-[11px] text-slate-400 block pt-1">
                              Sent on {formatDateTimeString(inq.created_at)}
                            </span>
                          </div>

                          {/* Dynamic Feedback Stream Frame */}
                          {inq.agent_reply ? (
                            <div className="bg-emerald-50/40 p-4 rounded-xl border border-emerald-100/70 space-y-1.5">
                              <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-1.5">
                                <MessageSquareReply className="w-3.5 h-3.5" /> Agent Response
                              </span>
                              <p className="text-sm text-slate-800 font-medium">"{inq.agent_reply}"</p>
                              {inq.replied_at && (
                                <span className="text-[11px] text-emerald-600/80 block pt-0.5">
                                  Replied on {formatDateTimeString(inq.replied_at)}
                                </span>
                              )}
                            </div>
                          ) : (
                            <div className="bg-slate-50/40 p-4 rounded-xl border border-dashed border-slate-200 text-slate-500">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                                Response Status
                              </span>
                              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                                Our agents have received this request and are compiling pricing variants or scheduling options. Hang tight!
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm">
              <UserSettings />
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
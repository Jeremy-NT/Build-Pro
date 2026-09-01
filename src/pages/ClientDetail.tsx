import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { 
  ArrowLeft, User, Phone, Mail, Building, Tag, Compass, FileText, Calendar, 
  MessageSquare, PlusCircle, Check, Play, AlertCircle, Clock, CheckCircle, 
  ChevronRight, CalendarDays, ExternalLink
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import { useAuth } from '../hooks/useAuth';
import { useAgentPropertiesBriefQuery } from '../features/properties/hooks/usePropertyQueries';
import { clientQueryKeys, useClientDetailQuery, useUpdateClientMutation } from '../features/clients/hooks/useClientQueries';
import { interactionQueryKeys, useClientInteractionsQuery, useCreateInteractionMutation } from '../features/interactions/hooks/useInteractionQueries';
import { reminderQueryKeys, useClientRemindersQuery, useCreateReminderMutation } from '../features/reminders/hooks/useReminderQueries';
import { useClientOriginInquiryQuery } from '../features/inquiries/hooks/useInquiryQueries';
import { LoadingSpinner, ErrorState } from '../shared/components/FeedbackStates';
import { getErrorMessage } from '../shared/utils/error';

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

interface Interaction {
  id: string;
  agent_id: string;
  client_id: string;
  property_id: string | null;
  type: 'call' | 'email' | 'meeting' | 'site_visit' | 'whatsapp' | 'note';
  summary: string;
  outcome: string | null;
  occurred_at: string;
  created_at: string;
}

interface Reminder {
  id: string;
  agent_id: string;
  client_id: string | null;
  property_id: string | null;
  title: string;
  due_at: string;
  status: 'pending' | 'completed' | 'dismissed';
  created_at: string;
  properties?: {
    title: string;
  } | null;
}

interface Property {
  id: string;
  title: string;
}

export const ClientDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const userId = user?.id;

  // Dialog Overlays states
  const [showInteractionModal, setShowInteractionModal] = useState(false);
  const [showReminderModal, setShowReminderModal] = useState(false);

  // Profile Inline editing fields states to track modified fields
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [editedEmail, setEditedEmail] = useState('');
  const [editedPhone, setEditedPhone] = useState('');
  const [editedType, setEditedType] = useState<any>('buyer');
  const [editedStatus, setEditedStatus] = useState<any>('lead');
  const [editedSource, setEditedSource] = useState('');
  const [editedNotes, setEditedNotes] = useState('');

  // Fetch agent properties to populate optional select in reminder setter
  const { data: agentProperties = [] } = useAgentPropertiesBriefQuery(userId);

  // Fetch client row 
  const { data: client, isLoading: isClientLoading, isError: isClientError, error: clientError, refetch: refetchClient } = useClientDetailQuery(id);

  useEffect(() => {
    if (!client) return;
    setEditedName(client.full_name || '');
    setEditedEmail(client.email || '');
    setEditedPhone(client.phone || '');
    setEditedType(client.client_type || 'buyer');
    setEditedStatus(client.status || 'lead');
    setEditedSource(client.source || '');
    setEditedNotes(client.notes || '');
  }, [client]);

  // Fetch associated interactions
  const { data: interactions = [] } = useClientInteractionsQuery(id);

  // Fetch associated reminders
  const { data: reminders = [] } = useClientRemindersQuery(id);

  // Check if this client was potentially created from an inquiry (look for inquiry with matching email)
  const { data: associatedInquiry } = useClientOriginInquiryQuery(client?.email || undefined);

  // UPDATE Profile mutation
  const updateProfileMutation = useUpdateClientMutation(id);

  // ADD Interaction mutation
  const [interactionType, setInteractionType] = useState<'call' | 'email' | 'meeting' | 'site_visit' | 'whatsapp' | 'note'>('call');
  const [interactionSummary, setInteractionSummary] = useState('');
  const [interactionOutcome, setInteractionOutcome] = useState('');
  const [interactionOccurred, setInteractionOccurred] = useState('');

  const interactionMutation = useCreateInteractionMutation(userId);

  // ADD Reminder mutation
  const [reminderTitle, setReminderTitle] = useState('');
  const [reminderDue, setReminderDue] = useState('');
  const [reminderPropId, setReminderPropId] = useState('');

  const reminderMutation = useCreateReminderMutation(userId);

  // Interaction icon helper
  const getInteractionIcon = (type: string) => {
    switch (type) {
      case 'call':
        return <Phone className="w-4 h-4 text-emerald-600" />;
      case 'email':
        return <Mail className="w-4 h-4 text-blue-600" />;
      case 'meeting':
        return <Compass className="w-4 h-4 text-indigo-600" />;
      case 'site_visit':
        return <Building className="w-4 h-4 text-amber-600" />;
      case 'whatsapp':
        return <MessageSquare className="w-4 h-4 text-green-650" />;
      default:
        return <FileText className="w-4 h-4 text-slate-500" />;
    }
  };

  if (isClientLoading) {
    return (
      <div className="min-h-[70vh]">
        <LoadingSpinner message="Retrieving client record dossiers..." fullPage />
      </div>
    );
  }

  if (isClientError || !client) {
    return (
      <div className="py-16">
        <ErrorState
          title="CRM records unavailable"
          description={getErrorMessage(clientError, 'The requested customer could not be mapped inside the tenant data workspace.')}
          onRetry={() => refetchClient()}
          retryLabel="Retry"
        />
      </div>
    );
  }

  const isOriginatingFromInquiry = client.source === 'inquiry' || !!associatedInquiry;

  return (
    <div className="space-y-6">
      
      {/* Back button header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <Link
          to="/dashboard/clients"
          className="inline-flex items-center gap-1.5 text-slate-600 hover:text-slate-900 text-xs font-extrabold transition"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Clients List
        </Link>

        {isOriginatingFromInquiry && (
          <Link
            to="/dashboard/inquiries"
            className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 px-3 py-1.5 rounded-xl text-xs font-semibold tracking-wide transition"
          >
            <ExternalLink className="w-3.5 h-3.5 shrink-0" />
            Created from Inquiry (View Inquiry Records)
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN: Profile Info & Preferences */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Profile Card */}
          <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm space-y-4 relative">
            <div className="flex items-center gap-3 border-b border-slate-50 pb-4">
              <div className="w-12 h-12 rounded-full bg-blue-600 font-mono text-white text-lg font-bold flex items-center justify-center uppercase shrink-0">
                {client.full_name.charAt(0)}
              </div>
              <div className="leading-tight">
                <h2 className="font-extrabold text-slate-900 text-base">{client.full_name}</h2>
                <span className="block text-[10px] text-slate-400 font-mono uppercase mt-0.5">Assigned Customer</span>
              </div>
            </div>

            {/* Inline Editor or Render Block */}
            {!isEditingProfile ? (
              <div className="space-y-4 text-xs font-semibold text-slate-700">
                <div className="space-y-2">
                  <div className="flex justify-between border-b border-dashed border-slate-50 pb-1.5">
                    <span className="text-slate-400 font-medium">Type preference:</span>
                    <span className="capitalize font-bold text-slate-900">{client.client_type || 'Unspecified'}</span>
                  </div>
                  <div className="flex justify-between border-b border-dashed border-slate-50 pb-1.5">
                    <span className="text-slate-400 font-medium">Pipeline Status:</span>
                    <span className="capitalize font-bold text-slate-900">{client.status}</span>
                  </div>
                  <div className="flex justify-between border-b border-dashed border-slate-50 pb-1.5">
                    <span className="text-slate-400 font-medium">Email:</span>
                    <span className="text-slate-900 truncate max-w-[160px]">{client.email || '—'}</span>
                  </div>
                  <div className="flex justify-between border-b border-dashed border-slate-50 pb-1.5">
                    <span className="text-slate-400 font-medium">Mobile Contact:</span>
                    <span className="text-slate-900">{client.phone || '—'}</span>
                  </div>
                  <div className="flex justify-between border-b border-dashed border-slate-50 pb-1.5">
                    <span className="text-slate-400 font-medium">Lead Origin:</span>
                    <span className="capitalize text-slate-900">{client.source || 'Direct Outreach'}</span>
                  </div>
                </div>

                <div>
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">General Notes</h4>
                  <p className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-slate-600 leading-normal font-sans text-[11px] max-h-40 overflow-y-auto whitespace-normal">
                    {client.notes || 'No description notes logged yet.'}
                  </p>
                </div>

                <button
                  onClick={() => setIsEditingProfile(true)}
                  className="w-full text-center py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-bold cursor-pointer transition text-[11px] uppercase tracking-wide"
                >
                  Edit Profile Fields Inline
                </button>
              </div>
            ) : (
              /* Profile Fields Editor form (saves on Save click) */
              <div className="space-y-3.5 text-xs font-sans">
                <div>
                  <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Name</label>
                  <input
                    type="text"
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-200 bg-slate-50 rounded-lg focus:bg-white text-xs"
                  />
                </div>
                
                <div>
                  <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Email</label>
                  <input
                    type="text"
                    value={editedEmail}
                    onChange={(e) => setEditedEmail(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-200 bg-slate-50 rounded-lg focus:bg-white text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Phone</label>
                  <input
                    type="text"
                    value={editedPhone}
                    onChange={(e) => setEditedPhone(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-200 bg-slate-50 rounded-lg focus:bg-white text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Category</label>
                  <select
                    value={editedType}
                    onChange={(e) => setEditedType(e.target.value as any)}
                    className="w-full px-2 py-1.5 border border-slate-200 bg-slate-50 rounded-lg text-xs"
                  >
                    <option value="buyer">Buyer</option>
                    <option value="renter">Renter</option>
                    <option value="seller">Seller</option>
                    <option value="investor">Investor</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Pipeline Status</label>
                  <select
                    value={editedStatus}
                    onChange={(e) => setEditedStatus(e.target.value as any)}
                    className="w-full px-2 py-1.5 border border-slate-200 bg-slate-50 rounded-lg text-xs"
                  >
                    <option value="lead">Lead</option>
                    <option value="active">Active</option>
                    <option value="closed">Closed Deal</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Lead Origin</label>
                  <input
                    type="text"
                    value={editedSource}
                    onChange={(e) => setEditedSource(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-200 bg-slate-50 rounded-lg focus:bg-white text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Preference Notes</label>
                  <textarea
                    rows={3}
                    value={editedNotes}
                    onChange={(e) => setEditedNotes(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-200 bg-slate-50 rounded-lg focus:bg-white text-xs"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => setIsEditingProfile(false)}
                    className="flex-1 text-center py-1.5 border border-slate-200 bg-white rounded-lg font-semibold hover:bg-slate-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() =>
                      updateProfileMutation.mutate(
                        {
                          full_name: editedName,
                          email: editedEmail,
                          phone: editedPhone,
                          client_type: editedType,
                          status: editedStatus,
                          notes: editedNotes,
                          source: editedSource,
                        },
                        {
                          onSuccess: () => {
                            toast.success('Client profile parameters updated.');
                            setIsEditingProfile(false);
                            queryClient.invalidateQueries({ queryKey: clientQueryKeys.detail(id) });
                            queryClient.invalidateQueries({ queryKey: clientQueryKeys.agentList(userId) });
                          },
                          onError: (err) => {
                            toast.error(getErrorMessage(err, 'Error occurred while saving profile changes.'));
                          }
                        }
                      )
                    }
                    disabled={updateProfileMutation.isPending}
                    className="flex-1 text-center py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition"
                  >
                    {updateProfileMutation.isPending ? 'Saving...' : 'Save Info'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Action Trigger Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setShowInteractionModal(true)}
              className="flex flex-col items-center justify-center p-4 bg-white border border-slate-100 rounded-2xl hover:bg-slate-50 transition shadow-sm gap-2 cursor-pointer text-center"
            >
              <PlusCircle className="w-5 h-5 text-blue-600 animate-hover" />
              <span className="text-xs font-bold font-sans text-slate-800 leading-tight">Log Contact</span>
            </button>
            <button
              onClick={() => setShowReminderModal(true)}
              className="flex flex-col items-center justify-center p-4 bg-white border border-slate-100 rounded-2xl hover:bg-slate-50 transition shadow-sm gap-2 cursor-pointer text-center"
            >
              <CalendarDays className="w-5 h-5 text-blue-600 animate-hover" />
              <span className="text-xs font-bold font-sans text-slate-800 leading-tight">Set Reminder</span>
            </button>
          </div>

          {/* Linked Client Reminders */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-bold uppercase text-slate-500 tracking-wider font-mono">Set Task Reminders ({reminders?.length || 0})</h3>
            
            {reminders && reminders.length > 0 ? (
              <div className="space-y-3 font-sans text-xs">
                {reminders.map((rem) => {
                  const isOverdue = new Date(rem.due_at) < new Date() && rem.status === 'pending';
                  return (
                    <div key={rem.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-start gap-2.5">
                      {rem.status === 'completed' ? (
                        <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      ) : isOverdue ? (
                        <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                      ) : (
                        <Clock className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                      )}
                      
                      <div className="leading-tight flex-1">
                        <p className={`font-bold text-slate-900 ${rem.status === 'completed' ? 'line-through text-slate-400' : ''}`}>{rem.title}</p>
                        <p className={`text-[10px] font-mono mt-1 ${isOverdue ? 'text-red-500 font-bold' : 'text-slate-400'}`}>
                          Due: {format(new Date(rem.due_at), 'MMM d, h:mm a')}
                        </p>
                        {rem.properties && (
                          <span className="text-[9px] bg-slate-100 text-slate-500 border border-slate-150 px-1 py-0.5 rounded inline-block mt-1 font-semibold truncate max-w-[160px]">
                            Prop: {rem.properties.title}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-slate-400 text-xs text-center py-4 font-sans leading-normal">No pending calendar reminders added for this client yet.</p>
            )}
          </div>

        </div>

        {/* RIGHT COLUMN: Chronological Interaction Timeline (takes remaining space) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-100 p-6 md:p-8 shadow-sm space-y-6">
            <div className="border-b border-slate-50 pb-4">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest font-mono">Contact Interaction Timeline</h3>
              <p className="text-xs text-slate-400 mt-1 font-sans">
                A historical chronological registry compiling phone conversations, WhatsApp chats, house tours, or note reminders.
              </p>
            </div>

            {interactions && interactions.length > 0 ? (
              <div className="relative border-l border-slate-100 pl-6 ml-3 space-y-6 text-xs text-slate-500">
                {interactions.map((int) => (
                  <div key={int.id} className="relative group">
                    {/* Circle Node element absolute positioned */}
                    <div className="absolute -left-[32px] top-1.5 w-5 h-5 rounded-full bg-white border border-slate-200 shadow-sm flex items-center justify-center">
                      {getInteractionIcon(int.type)}
                    </div>

                    <div className="bg-slate-50/50 hover:bg-slate-50 p-4 rounded-xl border border-slate-100 transition">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 mb-2.5">
                        <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 font-bold font-mono rounded tracking-wider uppercase">
                          {int.type}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">
                          {format(new Date(int.occurred_at), 'MMMM d, yyyy h:mm a')}
                        </span>
                      </div>

                      <div className="space-y-1.5 text-xs text-slate-800">
                        <p className="leading-relaxed font-semibold whitespace-pre-wrap whitespace-normal bg-white p-2 rounded border border-slate-50 shadow-xs font-sans">
                          {int.summary}
                        </p>
                        {int.outcome && (
                          <div className="text-[11px] bg-emerald-50/50 text-emerald-800 px-3 py-1.5 rounded-lg border border-emerald-100/30">
                            <strong>Outcome:</strong> {int.outcome}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-20 border border-dashed border-slate-100 bg-slate-50/30 rounded-2xl">
                <FileText className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-bold text-slate-700 font-sans">Timeline logs empty</p>
                <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto font-sans leading-normal">
                  You have not documented any email logs, telephone calls, or meetings under this portfolio panel yet.
                </p>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* interaction modal popup */}
      {showInteractionModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white p-6 max-w-md w-full rounded-2xl shadow-xl border border-slate-100 animate-in fade-in duration-200">
            <h3 className="text-sm font-black text-slate-900 tracking-tight font-sans">Log Contact Interaction</h3>
            <p className="text-[10px] text-slate-500 mt-1 mb-4 leading-normal font-sans">
              Archive conversation highlights in contact database pipelines. This helps compile agent KPI indices.
            </p>

            <form 
              onSubmit={(e) => {
                e.preventDefault();
                if (!userId || !id) {
                  toast.error('Unauthenticated user context');
                  return;
                }
                interactionMutation.mutate(
                  {
                    client_id: id,
                    type: interactionType,
                    summary: interactionSummary,
                    outcome: interactionOutcome,
                    occurred_at: interactionOccurred,
                  },
                  {
                    onSuccess: () => {
                      toast.success('Interaction logged successfully.');
                      setShowInteractionModal(false);
                      setInteractionSummary('');
                      setInteractionOutcome('');
                      setInteractionOccurred('');
                      queryClient.invalidateQueries({ queryKey: interactionQueryKeys.clientList(id) });
                      queryClient.invalidateQueries({ queryKey: interactionQueryKeys.recentFeed(userId) });
                    },
                    onError: (err) => {
                      toast.error(getErrorMessage(err, 'Error occurred saving interaction logs.'));
                    }
                  }
                );
              }}
              className="space-y-4 text-xs font-semibold"
            >
              <div>
                <label className="block text-[10px] font-bold text-slate-700 mb-1 uppercase tracking-wider">Interaction Type</label>
                <select
                  value={interactionType}
                  onChange={(e) => setInteractionType(e.target.value as any)}
                  className="w-full px-2.5 py-1.5 border border-slate-200 bg-slate-50 rounded-lg text-xs"
                >
                  <option value="call">Phone Call</option>
                  <option value="email">Email Sent/Received</option>
                  <option value="meeting">Physical Meeting</option>
                  <option value="site_visit">Site / Property Tour</option>
                  <option value="whatsapp">WhatsApp Text Message</option>
                  <option value="note">Internal Database Note</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-700 mb-1 uppercase tracking-wider">Communication Summary</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Detail preferred location updates, pricing offers, or customer concerns..."
                  value={interactionSummary}
                  onChange={(e) => setInteractionSummary(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-200 bg-slate-50 rounded-lg text-xs focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-700 mb-1 uppercase tracking-wider">Result / Outcome</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Schedule viewing next Monday, client agreed to price offer..."
                  value={interactionOutcome}
                  onChange={(e) => setInteractionOutcome(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-200 bg-slate-50 rounded-lg text-xs focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-700 mb-1 uppercase tracking-wider">Occurred At</label>
                <input
                  type="datetime-local"
                  required
                  value={interactionOccurred}
                  onChange={(e) => setInteractionOccurred(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-200 bg-slate-50 rounded-lg text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowInteractionModal(false)}
                  className="px-4 py-2 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={interactionMutation.isPending}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow transition"
                >
                  {interactionMutation.isPending ? 'Logging...' : 'Log Interaction'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Scheduler reminder modal popup */}
      {showReminderModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white p-6 max-w-sm w-full rounded-2xl shadow-xl border border-slate-100 animate-in fade-in duration-200">
            <h3 className="text-sm font-black text-slate-900 tracking-tight font-sans">Configure Follow-Up Reminder</h3>
            <p className="text-[10px] text-slate-500 mt-1 mb-4 leading-normal font-sans">
              Configure timing parameters for an automatic calendar notification.
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!userId || !id) {
                  toast.error('Unauthenticated user context');
                  return;
                }
                reminderMutation.mutate(
                  {
                    client_id: id,
                    title: reminderTitle,
                    due_at: new Date(reminderDue).toISOString(),
                    property_id: reminderPropId || null,
                    status: 'pending',
                  },
                  {
                    onSuccess: () => {
                      toast.success('Task follow-up reminder configured successfully.');
                      setShowReminderModal(false);
                      setReminderTitle('');
                      setReminderDue('');
                      setReminderPropId('');
                      queryClient.invalidateQueries({ queryKey: reminderQueryKeys.clientList(id) });
                      queryClient.invalidateQueries({ queryKey: reminderQueryKeys.agentList(userId) });
                    },
                    onError: (err) => {
                      toast.error(getErrorMessage(err, 'Error configuring reminder logs.'));
                    }
                  }
                );
              }}
              className="space-y-4 text-xs font-semibold"
            >
              <div>
                <label className="block text-[10px] font-bold text-slate-700 mb-1 uppercase tracking-wider">Action / Task Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Bring physical land documentation receipts"
                  value={reminderTitle}
                  onChange={(e) => setReminderTitle(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-200 bg-slate-50 rounded-lg text-xs focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-700 mb-1 uppercase tracking-wider">Associated Property (Optional)</label>
                <select
                  value={reminderPropId}
                  onChange={(e) => setReminderPropId(e.target.value)}
                  className="w-full px-2 py-1.5 border border-slate-200 bg-slate-50 rounded-lg text-xs"
                >
                  <option value="">No Property Relation</option>
                  {agentProperties?.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-700 mb-1 uppercase tracking-wider">Deadline Due date</label>
                <input
                  type="datetime-local"
                  required
                  value={reminderDue}
                  onChange={(e) => setReminderDue(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-200 bg-slate-50 rounded-lg text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 font-mono">
                <button
                  type="button"
                  onClick={() => setShowReminderModal(false)}
                  className="px-4 py-2 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={reminderMutation.isPending}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow transition"
                >
                  {reminderMutation.isPending ? 'Scheduling...' : 'Set Reminder'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

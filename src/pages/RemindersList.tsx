import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { 
  Plus, Calendar, Clock, CheckSquare, Trash, AlertTriangle, 
  CornerDownRight, Ban
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth';
import { reminderQueryKeys, useAgentRemindersQuery, useCreateReminderMutation, useDeleteReminderMutation, useUpdateReminderStatusMutation } from '../features/reminders/hooks/useReminderQueries';
import { dashboardQueryKeys } from '../features/dashboard/hooks/useDashboardQueries';
import { EmptyState, ErrorState, LoadingSpinner } from '../shared/components/FeedbackStates';
import { getErrorMessage } from '../shared/utils/error';

export const RemindersList: React.FC = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const userId = user?.id;
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'completed' | 'dismissed'>('all');

  // Quick-Add Form state
  const [quickTitle, setQuickTitle] = useState('');
  const [quickDue, setQuickDue] = useState('');

  // Confirmation Modal Delete state
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Fetch reminders with joined clients and properties
  const { data: reminders = [], isLoading, isError, error, refetch } = useAgentRemindersQuery(userId);

  const createMutation = useCreateReminderMutation(userId);

  const completeMutation = useUpdateReminderStatusMutation();

  const dismissMutation = useUpdateReminderStatusMutation();

  const deleteMutation = useDeleteReminderMutation();

  const handleQuickAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) {
      toast.error('Unauthenticated account session');
      return;
    }
    if (!quickTitle.trim() || !quickDue) {
      toast.error('Please enter a descriptive title and deadline due date');
      return;
    }
    createMutation.mutate(
      {
        title: quickTitle,
        due_at: new Date(quickDue).toISOString(),
        status: 'pending',
      },
      {
        onSuccess: () => {
          toast.success('New follow-up task added to checklist!');
          setQuickTitle('');
          setQuickDue('');
          queryClient.invalidateQueries({ queryKey: reminderQueryKeys.agentList(userId) });
          queryClient.invalidateQueries({ queryKey: dashboardQueryKeys.kpis(userId) });
        },
        onError: (err) => {
          toast.error(getErrorMessage(err, 'Error occurred while saving new reminder.'));
        }
      }
    );
  };

  // Filter list by tab select
  const filteredReminders = reminders.filter((rem) => {
    if (activeTab === 'all') return true;
    return rem.status === activeTab;
  });

  // Status style helper
  const getBadgeStyle = (status: string, isOverdue: boolean) => {
    if (status === 'completed') {
      return 'bg-green-50 text-green-700 border-green-200';
    }
    if (status === 'dismissed') {
      return 'bg-slate-100 text-slate-500 border-slate-300';
    }
    if (isOverdue) {
      return 'bg-red-50 text-red-650 border-red-200 font-bold';
    }
    return 'bg-amber-50 text-amber-700 border-amber-200';
  };

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div>
        <h2 className="text-xl font-black text-slate-900 tracking-tight font-sans">
          Calendar Follow-Up Reminders
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Stay on top of deal timelines, customer follow-up calls, and property inspection schedules.
        </p>
      </div>

      {/* QUICK ADD BLOCK */}
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
        <h3 className="text-xs font-bold uppercase text-slate-500 tracking-wider font-mono flex items-center gap-1.5">
          <CornerDownRight className="w-4 h-4 text-blue-600" />
          Quick Add Follow-up Task
        </h3>

        <form onSubmit={handleQuickAddSubmit} className="flex flex-col sm:flex-row gap-3 items-end">
          <div className="flex-1 w-full text-xs">
            <label className="block text-[10px] font-bold text-slate-600 mb-1 uppercase">Reminders Action Title</label>
            <input
              type="text"
              placeholder="e.g. Call Arthur to verify deposit progress"
              value={quickTitle}
              onChange={(e) => setQuickTitle(e.target.value)}
              className="w-full text-xs font-sans px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="w-full sm:w-auto text-xs">
            <label className="block text-[10px] font-bold text-slate-600 mb-1 uppercase">Due Date Time</label>
            <input
              type="datetime-local"
              value={quickDue}
              onChange={(e) => setQuickDue(e.target.value)}
              className="w-full text-xs font-sans px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={createMutation.isPending}
            className="w-full sm:w-auto px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 shrink-0 cursor-pointer shadow-md shadow-blue-500/10 uppercase"
          >
            {createMutation.isPending ? 'Saving...' : 'Add Action'}
            <Plus className="w-4 h-4" />
          </button>
        </form>
      </div>

      {/* FILTER TABS */}
      <div className="flex border-b border-slate-200 text-xs font-bold">
        {(['all', 'pending', 'completed', 'dismissed'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 border-b-2 font-sans capitalize transition cursor-pointer ${
              activeTab === tab 
                ? 'border-blue-600 text-blue-600' 
                : 'border-transparent text-slate-455 hover:text-slate-800'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* LIST SECTION */}
      {isLoading ? (
        <div className="bg-white border border-slate-100 rounded-2xl">
          <LoadingSpinner message="Compiling reminders dossier..." />
        </div>
      ) : isError ? (
        <ErrorState
          title="Error reading reminders"
          description={getErrorMessage(error, 'Could not authenticate table structures or query reminders data rows.')}
          onRetry={() => refetch()}
        />
      ) : filteredReminders.length === 0 ? (
        <EmptyState
          icon={<Calendar className="w-8 h-8" />}
          title="Clear calendar list"
          description={`You do not have any ${activeTab !== 'all' ? `${activeTab} ` : ''}reminders synchronized currently.`}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-sans">
          {filteredReminders.map((rem) => {
            const isOverdue = new Date(rem.due_at) < new Date() && rem.status === 'pending';
            
            return (
              <div 
                key={rem.id} 
                className={`bg-white rounded-2xl p-5 border shadow-sm transition relative overflow-hidden flex flex-col justify-between ${
                  isOverdue ? 'border-red-200 bg-red-50/20' : 'border-slate-100'
                }`}
              >
                {/* Overdue vertical flag status bar */}
                {isOverdue && (
                  <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-red-600"></div>
                )}

                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2.5">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5">
                        {isOverdue && <AlertTriangle className="w-3.5 h-3.5 text-red-600 shrink-0" />}
                        <h4 className={`text-sm font-bold text-slate-900 leading-tight ${rem.status === 'completed' ? 'line-through text-slate-400' : ''}`}>
                          {rem.title}
                        </h4>
                      </div>
                      
                      <div className={`flex items-center gap-1.5 text-[10px] font-semibold ${isOverdue ? 'text-red-600 font-bold' : 'text-slate-500'}`}>
                        <Clock className="w-3.5 h-3.5" />
                        <span>Deadline: {format(new Date(rem.due_at), 'MMM d, yyyy @ h:mm a')}</span>
                      </div>
                    </div>

                    <span className={`px-2.5 py-0.5 text-[9px] font-bold uppercase rounded border shrink-0 ${getBadgeStyle(rem.status, isOverdue)}`}>
                      {isOverdue ? 'Overdue' : rem.status}
                    </span>
                  </div>

                  {/* Joined metadata links */}
                  {(rem.clients || rem.properties) && (
                    <div className="border-t border-slate-50 pt-3 space-y-1 bg-slate-50/30 p-2.5 rounded-lg border border-slate-100/50">
                      {rem.clients && (
                        <div className="flex items-center gap-1.5 text-slate-500 text-[10px] font-bold">
                          <span className="text-slate-400 font-medium">CRM Client:</span>
                          <span className="text-slate-800">{rem.clients.full_name}</span>
                        </div>
                      )}
                      {rem.properties && (
                        <div className="flex items-center gap-1.5 text-slate-500 text-[10px] font-bold">
                          <span className="text-slate-400 font-medium">Property:</span>
                          <span className="text-slate-800 truncate max-w-[200px]">{rem.properties.title}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Individual row controls */}
                <div className="mt-4 pt-3 border-t border-slate-50 flex items-center justify-end gap-2 text-xs">
                  {rem.status === 'pending' && (
                    <>
                      <button
                        onClick={() =>
                          completeMutation.mutate(
                            { id: rem.id, status: 'completed' },
                            {
                              onSuccess: () => {
                                toast.success('Task marked as completed.');
                                queryClient.invalidateQueries({ queryKey: reminderQueryKeys.agentList(userId) });
                                queryClient.invalidateQueries({ queryKey: dashboardQueryKeys.kpis(userId) });
                              },
                              onError: (err) => {
                                toast.error(getErrorMessage(err, 'Error updating status.'));
                              }
                            }
                          )
                        }
                        disabled={completeMutation.isPending}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 border border-transparent rounded-lg font-bold transition flex items-center gap-1 cursor-pointer"
                        title="Mark Completed"
                      >
                        <CheckSquare className="w-3.5 h-3.5" />
                        <span>Complete</span>
                      </button>

                      <button
                        onClick={() =>
                          dismissMutation.mutate(
                            { id: rem.id, status: 'dismissed' },
                            {
                              onSuccess: () => {
                                toast.success('Task follow-up dismissed.');
                                queryClient.invalidateQueries({ queryKey: reminderQueryKeys.agentList(userId) });
                                queryClient.invalidateQueries({ queryKey: dashboardQueryKeys.kpis(userId) });
                              },
                              onError: (err) => {
                                toast.error(getErrorMessage(err, 'Error dismissing reminder.'));
                              }
                            }
                          )
                        }
                        disabled={dismissMutation.isPending}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg border border-transparent font-bold text-slate-600 transition flex items-center gap-1 cursor-pointer"
                        title="Dismiss Task"
                      >
                        <Ban className="w-3.5 h-3.5" />
                        <span>Dismiss</span>
                      </button>
                    </>
                  )}

                  <button
                    onClick={() => setDeleteId(rem.id)}
                    className="p-1.5 border border-slate-200 rounded-lg text-slate-500 hover:text-red-500 hover:bg-red-50 hover:border-red-100 transition cursor-pointer ml-auto"
                    title="Delete Reminder row"
                  >
                    <Trash className="w-3.5 h-3.5" />
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteId && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white p-6 max-w-sm w-full rounded-2xl shadow-xl border border-slate-100">
            <h4 className="text-sm font-black text-slate-900 tracking-tight font-sans">Delete Reminder?</h4>
            <p className="text-xs text-slate-555 mt-1 mb-5">
              Are you certain about deleting this task reminder? Deletion is irreversible.
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setDeleteId(null)}
                className="px-3.5 py-2 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() =>
                  deleteMutation.mutate(deleteId, {
                    onSuccess: () => {
                      toast.success('Reminder deleted successfully.');
                      setDeleteId(null);
                      queryClient.invalidateQueries({ queryKey: reminderQueryKeys.agentList(userId) });
                      queryClient.invalidateQueries({ queryKey: dashboardQueryKeys.kpis(userId) });
                    },
                    onError: (err) => {
                      toast.error(getErrorMessage(err, 'Error deleting reminder.'));
                      setDeleteId(null);
                    }
                  })
                }
                disabled={deleteMutation.isPending}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow cursor-pointer"
              >
                {deleteMutation.isPending ? 'Deleting...' : 'Delete Permanently'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

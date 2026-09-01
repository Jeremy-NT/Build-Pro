import { supabase } from '../../../lib/supabase';

export type ReminderStatus = 'pending' | 'completed' | 'dismissed';

export interface Reminder {
  id: string;
  agent_id: string;
  client_id: string | null;
  property_id: string | null;
  title: string;
  due_at: string;
  status: ReminderStatus;
  created_at: string;
  clients?: { full_name: string } | null;
  properties?: { title: string } | null;
}

export interface CreateReminderInput {
  title: string;
  due_at: string;
  status?: ReminderStatus;
  client_id?: string | null;
  property_id?: string | null;
}

export const getAgentReminders = async (agentId: string): Promise<Reminder[]> => {
  const { data, error } = await supabase
    .from('reminders')
    .select('*, clients(full_name), properties(title)')
    .eq('agent_id', agentId)
    .order('due_at', { ascending: true });

  if (error) throw error;
  return (data || []) as Reminder[];
};

export const getUpcomingReminders = async (agentId: string, limit = 5): Promise<Reminder[]> => {
  const { data, error } = await supabase
    .from('reminders')
    .select('*, clients(full_name)')
    .eq('agent_id', agentId)
    .eq('status', 'pending')
    .order('due_at', { ascending: true })
    .limit(limit);

  if (error) throw error;
  return (data || []) as Reminder[];
};

export const getClientReminders = async (clientId: string): Promise<Reminder[]> => {
  const { data, error } = await supabase
    .from('reminders')
    .select('*, properties(title)')
    .eq('client_id', clientId)
    .order('due_at', { ascending: true });

  if (error) throw error;
  return (data || []) as Reminder[];
};

export const createReminder = async (agentId: string, input: CreateReminderInput): Promise<void> => {
  const { error } = await supabase.from('reminders').insert({
    agent_id: agentId,
    title: input.title,
    due_at: input.due_at,
    status: input.status || 'pending',
    client_id: input.client_id || null,
    property_id: input.property_id || null,
  });

  if (error) throw error;
};

export const updateReminderStatus = async (id: string, status: ReminderStatus): Promise<void> => {
  const { error } = await supabase
    .from('reminders')
    .update({ status })
    .eq('id', id);

  if (error) throw error;
};

export const deleteReminder = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('reminders')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

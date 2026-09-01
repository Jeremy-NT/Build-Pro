import { supabase } from '../../../lib/supabase';

export interface DashboardKpis {
  activeListings: number;
  activeClients: number;
  pendingReminders: number;
  recentInquiries: number;
}

export const getDashboardKpis = async (userId: string): Promise<DashboardKpis> => {
  const { count: activeListings, error: propertiesError } = await supabase
    .from('properties')
    .select('*', { count: 'exact', head: true })
    .eq('agent_id', userId)
    .eq('status', 'available');
  if (propertiesError) throw propertiesError;

  const { count: activeClients, error: clientsError } = await supabase
    .from('clients')
    .select('*', { count: 'exact', head: true })
    .eq('agent_id', userId)
    .eq('status', 'active');
  if (clientsError) throw clientsError;

  const { count: pendingReminders, error: remindersError } = await supabase
    .from('reminders')
    .select('*', { count: 'exact', head: true })
    .eq('agent_id', userId)
    .eq('status', 'pending');
  if (remindersError) throw remindersError;

  const lastWeek = new Date();
  lastWeek.setDate(lastWeek.getDate() - 7);

  const { data: recentInquiries, error: inquiriesError } = await supabase
    .from('inquiries')
    .select(`
      id,
      created_at,
      properties!inner(agent_id)
    `)
    .eq('properties.agent_id', userId)
    .gte('created_at', lastWeek.toISOString());
  if (inquiriesError) throw inquiriesError;

  return {
    activeListings: activeListings || 0,
    activeClients: activeClients || 0,
    pendingReminders: pendingReminders || 0,
    recentInquiries: recentInquiries?.length || 0,
  };
};

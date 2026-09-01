import { supabase } from '../../../lib/supabase';

export type InteractionType = 'call' | 'email' | 'meeting' | 'site_visit' | 'whatsapp' | 'note';

export interface Interaction {
  id: string;
  agent_id: string;
  client_id: string;
  property_id: string | null;
  type: InteractionType;
  summary: string;
  outcome: string | null;
  occurred_at: string;
  created_at: string;
  clients?: { full_name: string } | null;
}

export interface CreateInteractionInput {
  client_id: string;
  type: InteractionType;
  summary: string;
  outcome?: string;
  occurred_at?: string;
}

export const getClientInteractions = async (clientId: string): Promise<Interaction[]> => {
  const { data, error } = await supabase
    .from('interactions')
    .select('*')
    .eq('client_id', clientId)
    .order('occurred_at', { ascending: false });

  if (error) throw error;
  return (data || []) as Interaction[];
};

export const getRecentAgentInteractions = async (agentId: string): Promise<Interaction[]> => {
  const { data, error } = await supabase
    .from('interactions')
    .select('*, clients(full_name)')
    .eq('agent_id', agentId)
    .order('occurred_at', { ascending: false })
    .limit(10);

  if (error) throw error;
  return (data || []) as Interaction[];
};

export const createInteraction = async (agentId: string, input: CreateInteractionInput): Promise<void> => {
  const { error } = await supabase.from('interactions').insert({
    agent_id: agentId,
    client_id: input.client_id,
    type: input.type,
    summary: input.summary,
    outcome: input.outcome || null,
    occurred_at: input.occurred_at ? new Date(input.occurred_at).toISOString() : new Date().toISOString(),
  });

  if (error) throw error;
};

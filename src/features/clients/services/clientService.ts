import { supabase } from '../../../lib/supabase';
import type { Client } from '../../../shared/types/domain';

export interface CreateClientInput {
  full_name: string;
  email?: string;
  phone?: string;
  client_type: 'buyer' | 'renter' | 'seller' | 'investor';
  status: 'lead' | 'active' | 'closed' | 'inactive';
  notes?: string;
  source?: string;
}

export interface UpdateClientInput {
  full_name: string;
  email?: string;
  phone?: string;
  client_type: 'buyer' | 'renter' | 'seller' | 'investor';
  status: 'lead' | 'active' | 'closed' | 'inactive';
  notes?: string;
  source?: string;
}

export const getAgentClients = async (agentId: string): Promise<Client[]> => {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('agent_id', agentId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []) as Client[];
};

export const createClient = async (agentId: string, input: CreateClientInput): Promise<Client> => {
  const { data, error } = await supabase
    .from('clients')
    .insert({
      agent_id: agentId,
      full_name: input.full_name,
      email: input.email || null,
      phone: input.phone || null,
      client_type: input.client_type,
      status: input.status,
      notes: input.notes || null,
      source: input.source || null,
    })
    .select()
    .single();

  if (error) throw error;
  return data as Client;
};

export const getClientById = async (id: string): Promise<Client> => {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data as Client;
};

export const updateClientById = async (id: string, input: UpdateClientInput): Promise<void> => {
  const { error } = await supabase
    .from('clients')
    .update({
      full_name: input.full_name,
      email: input.email || null,
      phone: input.phone || null,
      client_type: input.client_type,
      status: input.status,
      notes: input.notes || null,
      source: input.source || null,
    })
    .eq('id', id);

  if (error) throw error;
};

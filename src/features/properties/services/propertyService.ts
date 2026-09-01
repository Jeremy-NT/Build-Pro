import { supabase } from '../../../lib/supabase';
import type { Property } from '../../../shared/types/domain';

export interface PropertyBrief {
  id: string;
  title: string;
}

export const getAgentProperties = async (agentId: string): Promise<Property[]> => {
  const { data, error } = await supabase
    .from('properties')
    .select('*')
    .eq('agent_id', agentId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []) as Property[];
};

export const archiveProperty = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('properties')
    .update({ status: 'archived' })
    .eq('id', id);

  if (error) throw error;
};

export const getAgentPropertiesBrief = async (agentId: string): Promise<PropertyBrief[]> => {
  const { data, error } = await supabase
    .from('properties')
    .select('id, title')
    .eq('agent_id', agentId)
    .order('title');

  if (error) throw error;
  return (data || []) as PropertyBrief[];
};

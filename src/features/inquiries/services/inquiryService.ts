import { supabase } from '../../../lib/supabase';

export type InquiryStatus = 'new' | 'read' | 'responded' | 'closed';

export interface Inquiry {
  id: string;
  property_id: string;
  client_profile_id: string | null;
  sender_name: string;
  sender_email: string;
  sender_phone: string | null;
  message: string;
  status: InquiryStatus;
  agent_reply: string | null;
  replied_at: string | null;
  created_at: string;
  properties: {
    id: string;
    title: string;
    agent_id: string;
  } | null;
}

export const getAgentInquiries = async (userId: string, isAdmin: boolean): Promise<Inquiry[]> => {
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

  if (!isAdmin) {
    query = query.eq('properties.agent_id', userId);
  }

  const { data, error } = await query.order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []) as Inquiry[];
};

export const replyToInquiry = async (id: string, agentReply: string): Promise<void> => {
  const { error } = await supabase
    .from('inquiries')
    .update({
      status: 'responded',
      agent_reply: agentReply,
      replied_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (error) throw error;
};

export const markInquiryAsRead = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('inquiries')
    .update({ status: 'read' })
    .eq('id', id);

  if (error) throw error;
};

export const getClientOriginInquiry = async (email: string): Promise<{ id: string; message: string; property_id: string } | null> => {
  const { data, error } = await supabase
    .from('inquiries')
    .select('id, message, property_id')
    .eq('sender_email', email)
    .limit(1);

  if (error) return null;
  return data && data.length > 0 ? data[0] : null;
};

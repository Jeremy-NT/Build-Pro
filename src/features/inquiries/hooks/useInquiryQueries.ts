import { useMutation, useQuery } from '@tanstack/react-query';
import { getAgentInquiries, getClientOriginInquiry, markInquiryAsRead, replyToInquiry } from '../services/inquiryService';

export const inquiryQueryKeys = {
  agentList: (userId?: string, isAdmin?: boolean) => ['agentInquiries', userId, isAdmin] as const,
  clientOrigin: (email?: string) => ['clientOriginInquiry', email] as const,
};

export const useAgentInquiriesQuery = (userId?: string, isAdmin = false) =>
  useQuery({
    queryKey: inquiryQueryKeys.agentList(userId, isAdmin),
    queryFn: () => getAgentInquiries(userId as string, isAdmin),
    enabled: !!userId,
  });

export const useClientOriginInquiryQuery = (email?: string) =>
  useQuery({
    queryKey: inquiryQueryKeys.clientOrigin(email),
    queryFn: () => getClientOriginInquiry(email as string),
    enabled: !!email,
  });

export const useReplyToInquiryMutation = () =>
  useMutation({
    mutationKey: ['replyToInquiry'],
    mutationFn: ({ id, replyText }: { id: string; replyText: string }) => replyToInquiry(id, replyText),
  });

export const useMarkInquiryReadMutation = () =>
  useMutation({
    mutationKey: ['markInquiryRead'],
    mutationFn: (id: string) => markInquiryAsRead(id),
  });

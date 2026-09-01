import { useMutation, useQuery } from '@tanstack/react-query';
import { createInteraction, getClientInteractions, getRecentAgentInteractions, type CreateInteractionInput } from '../services/interactionService';

export const interactionQueryKeys = {
  recentFeed: (agentId?: string) => ['activitiesFeed', agentId] as const,
  clientList: (clientId?: string) => ['clientInteractions', clientId] as const,
};

export const useRecentInteractionsQuery = (agentId?: string) =>
  useQuery({
    queryKey: interactionQueryKeys.recentFeed(agentId),
    queryFn: () => getRecentAgentInteractions(agentId as string),
    enabled: !!agentId,
  });

export const useClientInteractionsQuery = (clientId?: string) =>
  useQuery({
    queryKey: interactionQueryKeys.clientList(clientId),
    queryFn: () => getClientInteractions(clientId as string),
    enabled: !!clientId,
  });

export const useCreateInteractionMutation = (agentId?: string) =>
  useMutation({
    mutationKey: ['createInteraction', agentId],
    mutationFn: (input: CreateInteractionInput) => createInteraction(agentId as string, input),
  });

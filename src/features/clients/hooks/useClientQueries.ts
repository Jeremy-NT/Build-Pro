import { useMutation, useQuery } from '@tanstack/react-query';
import { createClient, getAgentClients, getClientById, updateClientById, type CreateClientInput, type UpdateClientInput } from '../services/clientService';

export const clientQueryKeys = {
  all: ['clients'] as const,
  agentList: (agentId?: string) => ['agentClients', agentId] as const,
  detail: (clientId?: string) => ['clientDetail', clientId] as const,
};

export const useAgentClientsQuery = (agentId?: string) =>
  useQuery({
    queryKey: clientQueryKeys.agentList(agentId),
    queryFn: () => getAgentClients(agentId as string),
    enabled: !!agentId,
  });

export const useClientDetailQuery = (clientId?: string) =>
  useQuery({
    queryKey: clientQueryKeys.detail(clientId),
    queryFn: () => getClientById(clientId as string),
    enabled: !!clientId,
  });

export const useCreateClientMutation = (agentId?: string) =>
  useMutation({
    mutationKey: ['createClient', agentId],
    mutationFn: (values: CreateClientInput) => createClient(agentId as string, values),
  });

export const useUpdateClientMutation = (clientId?: string) =>
  useMutation({
    mutationKey: ['updateClient', clientId],
    mutationFn: (values: UpdateClientInput) => updateClientById(clientId as string, values),
  });

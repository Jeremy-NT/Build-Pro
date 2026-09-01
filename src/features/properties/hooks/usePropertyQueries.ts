import { useMutation, useQuery } from '@tanstack/react-query';
import { archiveProperty, getAgentProperties, getAgentPropertiesBrief } from '../services/propertyService';

export const propertyQueryKeys = {
  all: ['properties'] as const,
  agentList: (agentId?: string) => ['agentProperties', agentId] as const,
  agentBrief: (agentId?: string) => ['agentPropertiesBrief', agentId] as const,
};

export const useAgentPropertiesQuery = (agentId?: string) =>
  useQuery({
    queryKey: propertyQueryKeys.agentList(agentId),
    queryFn: () => getAgentProperties(agentId as string),
    enabled: !!agentId,
  });

export const useAgentPropertiesBriefQuery = (agentId?: string) =>
  useQuery({
    queryKey: propertyQueryKeys.agentBrief(agentId),
    queryFn: () => getAgentPropertiesBrief(agentId as string),
    enabled: !!agentId,
  });

export const useArchivePropertyMutation = () =>
  useMutation({
    mutationKey: ['archiveProperty'],
    mutationFn: archiveProperty,
  });

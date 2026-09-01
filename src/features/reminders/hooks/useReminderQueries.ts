import { useMutation, useQuery } from '@tanstack/react-query';
import { createReminder, deleteReminder, getAgentReminders, getClientReminders, getUpcomingReminders, updateReminderStatus, type CreateReminderInput, type ReminderStatus } from '../services/reminderService';

export const reminderQueryKeys = {
  all: ['reminders'] as const,
  agentList: (agentId?: string) => ['agentReminders', agentId] as const,
  upcoming: (agentId?: string) => ['dashboardUpcomingReminders', agentId] as const,
  clientList: (clientId?: string) => ['clientReminders', clientId] as const,
};

export const useAgentRemindersQuery = (agentId?: string) =>
  useQuery({
    queryKey: reminderQueryKeys.agentList(agentId),
    queryFn: () => getAgentReminders(agentId as string),
    enabled: !!agentId,
  });

export const useUpcomingRemindersQuery = (agentId?: string, limit = 5) =>
  useQuery({
    queryKey: reminderQueryKeys.upcoming(agentId),
    queryFn: () => getUpcomingReminders(agentId as string, limit),
    enabled: !!agentId,
  });

export const useClientRemindersQuery = (clientId?: string) =>
  useQuery({
    queryKey: reminderQueryKeys.clientList(clientId),
    queryFn: () => getClientReminders(clientId as string),
    enabled: !!clientId,
  });

export const useCreateReminderMutation = (agentId?: string) =>
  useMutation({
    mutationKey: ['createReminder', agentId],
    mutationFn: (input: CreateReminderInput) => createReminder(agentId as string, input),
  });

export const useUpdateReminderStatusMutation = () =>
  useMutation({
    mutationKey: ['updateReminderStatus'],
    mutationFn: ({ id, status }: { id: string; status: ReminderStatus }) => updateReminderStatus(id, status),
  });

export const useDeleteReminderMutation = () =>
  useMutation({
    mutationKey: ['deleteReminder'],
    mutationFn: (id: string) => deleteReminder(id),
  });

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import client from '../api/client';

export function useAlerts(options = {}) {
  return useQuery({
    queryKey: ['alerts'],
    queryFn: async () => {
      const { data } = await client.get('/alerts', {
        params: {
          acknowledged: options.acknowledged,
          limit: options.limit || 100,
          offset: options.offset || 0,
        },
      });
      return data;
    },
    refetchInterval: 30000,
  });
}

export function useUnreadAlertCount() {
  return useQuery({
    queryKey: ['alerts-unread-count'],
    queryFn: async () => {
      const { data } = await client.get('/alerts/unread-count');
      return data.count;
    },
    refetchInterval: 30000,
  });
}

export function useAcknowledgeAlert(id) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data } = await client.patch(`/alerts/${id}/acknowledge`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      queryClient.invalidateQueries({ queryKey: ['alerts-unread-count'] });
    },
  });
}

export function useAcknowledgeAllAlerts() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data } = await client.post('/alerts/acknowledge-all');
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      queryClient.invalidateQueries({ queryKey: ['alerts-unread-count'] });
    },
  });
}

export function useDeleteAlert(id) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data } = await client.delete(`/alerts/${id}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      queryClient.invalidateQueries({ queryKey: ['alerts-unread-count'] });
    },
  });
}

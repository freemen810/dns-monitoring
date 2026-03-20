import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import client from '../api/client';

export function useMonitors() {
  return useQuery({
    queryKey: ['monitors'],
    queryFn: async () => {
      const { data } = await client.get('/monitors');
      return data;
    },
    refetchInterval: 30000, // 30 seconds
  });
}

export function useMonitor(id) {
  return useQuery({
    queryKey: ['monitors', id],
    queryFn: async () => {
      const { data } = await client.get(`/monitors/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

export function useCreateMonitor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (monitorData) => {
      const { data } = await client.post('/monitors', monitorData);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['monitors'] });
    },
  });
}

export function useUpdateMonitor(id) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (monitorData) => {
      const { data } = await client.put(`/monitors/${id}`, monitorData);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['monitors'] });
      queryClient.invalidateQueries({ queryKey: ['monitors', id] });
    },
  });
}

export function useDeleteMonitor(id) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data } = await client.delete(`/monitors/${id}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['monitors'] });
    },
  });
}

export function useManualPoll(id) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data } = await client.post(`/monitors/${id}/poll`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['monitors', id] });
      queryClient.invalidateQueries({ queryKey: ['results'] });
    },
  });
}

export function usePauseMonitor(id) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data } = await client.patch(`/monitors/${id}/pause`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['monitors'] });
      queryClient.invalidateQueries({ queryKey: ['monitors', id] });
    },
  });
}

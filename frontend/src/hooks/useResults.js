import { useQuery } from '@tanstack/react-query';
import client from '../api/client';

export function useResults(monitorId, options = {}) {
  return useQuery({
    queryKey: ['results', monitorId],
    queryFn: async () => {
      const { data } = await client.get('/results', {
        params: {
          monitor_id: monitorId,
          limit: options.limit || 100,
          offset: options.offset || 0,
        },
      });
      return data;
    },
    enabled: !!monitorId,
    refetchInterval: 30000,
  });
}

export function useResponseTimes(monitorId, options = {}) {
  return useQuery({
    queryKey: ['response-times', monitorId],
    queryFn: async () => {
      const { data } = await client.get(`/stats/${monitorId}/response-times`, {
        params: {
          from: options.from,
          to: options.to,
          limit: options.limit || 1000,
        },
      });
      return data;
    },
    enabled: !!monitorId,
  });
}

export function useUptime(monitorId, days = 7) {
  return useQuery({
    queryKey: ['uptime', monitorId, days],
    queryFn: async () => {
      const { data } = await client.get(`/stats/${monitorId}/uptime`, {
        params: { days },
      });
      return data;
    },
    enabled: !!monitorId,
  });
}

export function useAllResponseTimes(options = {}) {
  return useQuery({
    queryKey: ['all-response-times', options.from, options.to, options.limit],
    queryFn: async () => {
      const { data } = await client.get('/stats/all/response-times', {
        params: {
          from: options.from,
          to: options.to,
          limit: options.limit || 200,
        },
      });
      return data;
    },
    refetchInterval: 30000,
  });
}

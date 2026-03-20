import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';
import { useState } from 'react';

const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

export function DNSServerPerformanceChart({ data }) {
  const [chartType, setChartType] = useState('line');

  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">DNS Server Performance</h3>
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <div className="text-gray-400 text-sm mb-2">No performance data available</div>
            <div className="text-gray-300 text-xs">Check your DNS servers and try again</div>
          </div>
        </div>
      </div>
    );
  }

  // Group response times by DNS server
  const groupedByServer = {};
  const timepoints = {};

  data.forEach((item) => {
    const server = item.dns_server || 'Unknown';
    const timeKey = item.queried_at;

    if (!groupedByServer[server]) {
      groupedByServer[server] = [];
    }

    groupedByServer[server].push({
      time: format(new Date(item.queried_at), 'MMM dd HH:mm'),
      queried_at: item.queried_at,
      response_ms: item.response_ms,
      status: item.status,
    });

    if (!timepoints[timeKey]) {
      timepoints[timeKey] = {
        queried_at: timeKey,
        time: format(new Date(timeKey), 'MMM dd HH:mm'),
      };
    }
  });

  // Calculate stats per server
  const serverStats = Object.entries(groupedByServer).map(([server, responses]) => {
    const validResponses = responses.filter((r) => r.status === 'ok').map((r) => r.response_ms);
    const avgResponse = validResponses.length > 0 ? Math.round(validResponses.reduce((a, b) => a + b, 0) / validResponses.length) : 0;
    const minResponse = validResponses.length > 0 ? Math.min(...validResponses) : 0;
    const maxResponse = validResponses.length > 0 ? Math.max(...validResponses) : 0;

    return {
      server,
      avg: avgResponse,
      min: minResponse,
      max: maxResponse,
      samples: validResponses.length,
    };
  });

  // Prepare line chart data - one point per time for each server
  const lineChartData = [];
  const sortedTimes = Object.values(timepoints).sort((a, b) => new Date(a.queried_at) - new Date(b.queried_at));

  sortedTimes.forEach((point) => {
    const dataPoint = {
      time: point.time,
      queried_at: point.queried_at,
    };

    Object.entries(groupedByServer).forEach(([server, responses]) => {
      const match = responses.find((r) => r.queried_at === point.queried_at);
      if (match && match.status === 'ok') {
        dataPoint[server] = match.response_ms;
      }
    });

    lineChartData.push(dataPoint);
  });

  const servers = Object.keys(groupedByServer);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-gray-900">DNS Server Performance</h3>
        <div className="flex gap-2">
          <button
            onClick={() => setChartType('line')}
            className={`px-3 py-1 text-xs rounded font-medium transition ${
              chartType === 'line'
                ? 'bg-blue-100 text-blue-700 border border-blue-300'
                : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'
            }`}
          >
            Timeline
          </button>
          <button
            onClick={() => setChartType('bar')}
            className={`px-3 py-1 text-xs rounded font-medium transition ${
              chartType === 'bar'
                ? 'bg-blue-100 text-blue-700 border border-blue-300'
                : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'
            }`}
          >
            Average
          </button>
        </div>
      </div>

      {chartType === 'line' ? (
        <>
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={lineChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" angle={-45} textAnchor="end" height={100} tick={{ fontSize: 12 }} />
              <YAxis label={{ value: 'Response Time (ms)', angle: -90, position: 'insideLeft' }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#f9fafb', border: '1px solid #e5e7eb' }}
                formatter={(value) => (value ? `${value} ms` : 'N/A')}
              />
              <Legend />
              {servers.map((server, index) => (
                <Line
                  key={server}
                  type="monotone"
                  dataKey={server}
                  stroke={COLORS[index % COLORS.length]}
                  dot={false}
                  isAnimationActive={false}
                  strokeWidth={2}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
          <div className="mt-4 text-sm text-gray-600">
            <p>Showing response times over time for each DNS server</p>
          </div>
        </>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={serverStats}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="server" angle={-45} textAnchor="end" height={100} tick={{ fontSize: 12 }} />
              <YAxis label={{ value: 'Response Time (ms)', angle: -90, position: 'insideLeft' }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#f9fafb', border: '1px solid #e5e7eb' }}
                formatter={(value) => `${value} ms`}
              />
              <Legend />
              <Bar dataKey="avg" fill="#3b82f6" name="Average" />
              <Bar dataKey="min" fill="#10b981" name="Min" />
              <Bar dataKey="max" fill="#ef4444" name="Max" />
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-4 text-sm text-gray-600 space-y-1">
            <p>Average, minimum, and maximum response times for each DNS server</p>
            {serverStats.map((stat) => (
              <div key={stat.server} className="text-xs text-gray-500">
                {stat.server}: {stat.samples} samples, avg {stat.avg}ms
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

import { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';

const COLORS = [
  '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899',
  '#06b6d4', '#f97316', '#14b8a6', '#a855f7', '#0ea5e9', '#6366f1'
];

export function DashboardComparisonChart({ data }) {
  const [timeRange, setTimeRange] = useState('24h');
  const [showAggregated, setShowAggregated] = useState(true);

  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Response Time</h3>
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <div className="text-gray-400 text-sm mb-2">No monitoring data yet</div>
            <div className="text-gray-300 text-xs">Start creating monitors to see response time metrics</div>
          </div>
        </div>
      </div>
    );
  }

  // Transform data for Recharts - group by time, monitor, and server
  const groupedData = {};
  data.forEach((item) => {
    const key = item.queried_at;
    if (!groupedData[key]) {
      groupedData[key] = {
        queried_at: item.queried_at,
        time: format(new Date(item.queried_at), 'MMM dd HH:mm'),
        responses: [],
      };
    }
    const seriesKey = `${item.monitor_name} @ ${item.dns_server}`;
    groupedData[key][seriesKey] = item.response_ms;
    groupedData[key].responses.push(item.response_ms);
  });

  // Calculate aggregated (average) response time
  Object.values(groupedData).forEach((point) => {
    if (point.responses.length > 0) {
      point['Avg Response Time'] = Math.round(
        point.responses.reduce((a, b) => a + b, 0) / point.responses.length
      );
    }
  });

  const chartData = Object.values(groupedData);

  // Get unique series (monitor@server combinations)
  const series = [];
  data.forEach((item) => {
    const key = `${item.monitor_name} @ ${item.dns_server}`;
    if (!series.includes(key)) {
      series.push(key);
    }
  });

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold text-gray-900">Response Time</h3>
        <div className="flex gap-2 items-center">
          <button
            onClick={() => setShowAggregated(!showAggregated)}
            className={`px-3 py-1 text-xs rounded font-medium transition ${
              showAggregated
                ? 'bg-purple-100 text-purple-700 border border-purple-300'
                : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'
            }`}
          >
            {showAggregated ? '✓ Combined' : 'Combined'}
          </button>
          {['1h', '6h', '24h', '7d'].map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1 text-xs rounded ${
                timeRange === range
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={500}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="time" angle={-45} textAnchor="end" height={100} tick={{ fontSize: 12 }} />
          <YAxis label={{ value: 'Response Time (ms)', angle: -90, position: 'insideLeft' }} />
          <Tooltip
            contentStyle={{ backgroundColor: '#f9fafb', border: '1px solid #e5e7eb' }}
            formatter={(value) => [`${value} ms`, '']}
          />
          <Legend />
          {showAggregated && (
            <Line
              type="monotone"
              dataKey="Avg Response Time"
              stroke="#9333ea"
              strokeWidth={3}
              dot={false}
              isAnimationActive={false}
              name="Combined Average"
            />
          )}
          {series.map((key, index) => (
            <Line
              key={key}
              type="monotone"
              dataKey={key}
              stroke={COLORS[index % COLORS.length]}
              dot={false}
              isAnimationActive={false}
              strokeWidth={1}
              opacity={showAggregated ? 0.4 : 1}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>

      {series.length > 0 && (
        <div className="mt-4 text-sm text-gray-600">
          <p>Monitoring {series.length} DNS server{series.length !== 1 ? 's' : ''}</p>
          {showAggregated && <p className="text-purple-600 font-medium mt-1">● Combined Average line shows aggregated performance across all monitors</p>}
        </div>
      )}
    </div>
  );
}

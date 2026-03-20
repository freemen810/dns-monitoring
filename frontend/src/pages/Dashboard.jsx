import { Link } from 'react-router-dom';
import { useMonitors } from '../hooks/useMonitors';
import { useAllResponseTimes } from '../hooks/useResults';
import { useQuery } from '@tanstack/react-query';
import client from '../api/client';
import { MonitorCard } from '../components/dashboard/MonitorCard';
import { DashboardComparisonChart } from '../components/charts/DashboardComparisonChart';
import { EmptyState } from '../components/common/EmptyState';

function DashboardSummary() {
  const { data: summary } = useQuery({
    queryKey: ['stats', 'summary'],
    queryFn: async () => {
      const { data } = await client.get('/stats/summary');
      return data;
    },
    refetchInterval: 30000,
  });

  if (!summary) return null;

  return (
    <div className="grid grid-cols-3 gap-6 mb-8">
      <div className="bg-white rounded-lg border border-gray-100 p-6 hover:shadow-sm transition-shadow duration-200">
        <div className="text-2xl font-bold text-gray-900">{summary.totalMonitors}</div>
        <div className="text-sm text-gray-500 mt-2">Total Monitors</div>
      </div>
      <div className="bg-white rounded-lg border border-gray-100 p-6 hover:shadow-sm transition-shadow duration-200">
        <div className="text-2xl font-bold text-error">{summary.failingMonitors}</div>
        <div className="text-sm text-gray-500 mt-2">Failing</div>
      </div>
      <div className="bg-white rounded-lg border border-gray-100 p-6 hover:shadow-sm transition-shadow duration-200">
        <div className="text-2xl font-bold text-warning">{summary.alertsToday}</div>
        <div className="text-sm text-gray-500 mt-2">Alerts Today</div>
      </div>
    </div>
  );
}

export function Dashboard() {
  const { data: monitors, isLoading } = useMonitors();
  const { data: responseTimesData } = useAllResponseTimes();

  if (isLoading) {
    return <div className="p-8 text-center">Loading monitors...</div>;
  }

  if (!monitors || monitors.length === 0) {
    return (
      <div className="px-8 py-6">
        <div className="max-w-7xl mx-auto">
          <DashboardSummary />
          <EmptyState
            title="No monitors yet"
            description="Create your first DNS monitor to start monitoring your infrastructure"
            action={
              <Link to="/monitors" className="inline-block px-6 py-3 bg-accent-600 text-white rounded-lg hover:bg-accent-700 font-medium transition-colors duration-150">
                Create First Monitor
              </Link>
            }
          />
        </div>
      </div>
    );
  }

  // Sort: failing first, then by name
  const sorted = [...monitors].sort((a, b) => {
    if (a.last_status !== b.last_status) {
      if (a.last_status === 'ok') return 1;
      if (b.last_status === 'ok') return -1;
    }
    return a.name.localeCompare(b.name);
  });

  return (
    <div className="px-8 py-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Dashboard</h1>
          <p className="text-gray-500 mt-2">Overview of your DNS monitors and status</p>
        </div>

        {/* Summary Cards */}
        <DashboardSummary />

        {/* Chart */}
        <div className="mb-8">
          <DashboardComparisonChart data={responseTimesData} />
        </div>

        {/* Monitors Section */}
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Monitors</h2>
            <p className="text-gray-500 text-sm mt-1">{sorted.length} monitors in total</p>
          </div>
          <Link to="/monitors" className="px-5 py-2 bg-accent-600 text-white rounded-lg hover:bg-accent-700 text-sm font-medium transition-colors duration-150">
            Manage Monitors
          </Link>
        </div>

        {/* Monitor Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sorted.map((monitor) => (
            <MonitorCard key={monitor.id} monitor={monitor} />
          ))}
        </div>
      </div>
    </div>
  );
}

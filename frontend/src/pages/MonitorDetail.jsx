import { useParams, useNavigate } from 'react-router-dom';
import { useMonitor, useManualPoll } from '../hooks/useMonitors';
import { useResults, useResponseTimes, useUptime } from '../hooks/useResults';
import { StatusPill } from '../components/common/StatusPill';
import { ResponseTimeChart } from '../components/charts/ResponseTimeChart';
import { DNSServerPerformanceChart } from '../components/charts/DNSServerPerformanceChart';
import { formatDistanceToNow } from 'date-fns';

export function MonitorDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: monitor, isLoading } = useMonitor(id);
  const { data: resultsData } = useResults(id);
  const { data: responseTimesData } = useResponseTimes(id);
  const { data: uptime } = useUptime(id);
  const manualPoll = useManualPoll(id);

  if (isLoading) {
    return <div className="p-8 text-center">Loading monitor...</div>;
  }

  if (!monitor) {
    return <div className="p-8 text-center text-red-600">Monitor not found</div>;
  }

  const results = resultsData?.data || [];

  return (
    <div className="p-8">
      <div className="mb-6 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{monitor.name}</h1>
          <p className="text-gray-600 mt-2">{monitor.domain}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => navigate(`/monitors/${id}/edit`)}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            Edit
          </button>
          <button
            onClick={() => manualPoll.mutate()}
            disabled={manualPoll.isPending}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {manualPoll.isPending ? 'Polling...' : 'Poll Now'}
          </button>
        </div>
      </div>

      {/* Status Section */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="text-sm text-gray-600 mb-2">Status</div>
          <div className="flex items-center gap-2">
            <StatusPill status={monitor.last_status || 'fail'} />
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="text-sm text-gray-600 mb-2">Record Type</div>
          <div className="text-2xl font-bold text-gray-900">{monitor.record_type}</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="text-sm text-gray-600 mb-2">Response Time</div>
          <div className="text-2xl font-bold text-gray-900">
            {monitor.last_response_ms ? `${monitor.last_response_ms}ms` : 'N/A'}
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="text-sm text-gray-600 mb-2">Uptime (7d)</div>
          <div className="text-2xl font-bold text-gray-900">{uptime?.uptime || 0}%</div>
        </div>
      </div>

      {/* Configuration */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Configuration</h3>
          <div className="space-y-3 text-sm">
            <div>
              <div className="text-gray-600">DNS Servers</div>
              <div className="font-medium text-gray-900 space-y-1">
                {(() => {
                  try {
                    const servers = monitor.dns_servers ? JSON.parse(monitor.dns_servers) :
                      [{ server: monitor.dns_server || '1.1.1.1', port: monitor.dns_port || 53 }];
                    return servers.map((s, i) => (
                      <div key={i}>{s.server}:{s.port}</div>
                    ));
                  } catch {
                    return <div>{monitor.dns_server}:{monitor.dns_port}</div>;
                  }
                })()}
              </div>
            </div>
            <div>
              <div className="text-gray-600">Poll Interval</div>
              <div className="font-medium text-gray-900">{monitor.interval_sec} seconds</div>
            </div>
            <div>
              <div className="text-gray-600">Data Retention</div>
              <div className="font-medium text-gray-900">{monitor.retention_days} days</div>
            </div>
            <div>
              <div className="text-gray-600">Status</div>
              <div className="font-medium text-gray-900">
                {monitor.is_active ? '🟢 Active' : '🔴 Paused'}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Alerts</h3>
          <div className="space-y-3 text-sm">
            <div>
              <div className="text-gray-600">Alert on Change</div>
              <div className="font-medium text-gray-900">{monitor.alert_on_change ? '✓ Enabled' : '✗ Disabled'}</div>
            </div>
            <div>
              <div className="text-gray-600">Alert on Failure</div>
              <div className="font-medium text-gray-900">{monitor.alert_on_fail ? '✓ Enabled' : '✗ Disabled'}</div>
            </div>
            {monitor.webhook_url && (
              <div>
                <div className="text-gray-600">Webhook</div>
                <div className="font-medium text-gray-900 break-all text-xs">{monitor.webhook_url}</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Charts */}
      {responseTimesData && responseTimesData.length > 0 && (
        <div className="mb-6">
          <ResponseTimeChart data={responseTimesData} />
          <DNSServerPerformanceChart data={responseTimesData} />
        </div>
      )}

      {/* Results History */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Results</h3>
        {results.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No results yet</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-200">
                <tr>
                  <th className="px-4 py-2 text-left text-gray-700 font-medium">Queried</th>
                  <th className="px-4 py-2 text-left text-gray-700 font-medium">DNS Server</th>
                  <th className="px-4 py-2 text-left text-gray-700 font-medium">Status</th>
                  <th className="px-4 py-2 text-left text-gray-700 font-medium">Response Time</th>
                  <th className="px-4 py-2 text-left text-gray-700 font-medium">Records</th>
                  <th className="px-4 py-2 text-left text-gray-700 font-medium">Changed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {results.map((result) => (
                  <tr key={result.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2">
                      {formatDistanceToNow(new Date(result.queried_at), { addSuffix: true })}
                    </td>
                    <td className="px-4 py-2 text-xs font-medium text-gray-600">{result.dns_server || 'N/A'}</td>
                    <td className="px-4 py-2">
                      <StatusPill status={result.status} />
                    </td>
                    <td className="px-4 py-2">{result.response_ms ? `${result.response_ms}ms` : 'N/A'}</td>
                    <td className="px-4 py-2 text-xs">
                      <code className="bg-gray-100 px-2 py-1 rounded">
                        {result.records ? JSON.parse(result.records).join(', ') : '-'}
                      </code>
                    </td>
                    <td className="px-4 py-2">{result.changed ? '✓' : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

import { useState } from 'react';
import { useAlerts, useAcknowledgeAllAlerts } from '../hooks/useAlerts';
import { AlertList } from '../components/alerts/AlertList';
import { EmptyState } from '../components/common/EmptyState';

export function AlertsLog() {
  const [showUnacknowledged, setShowUnacknowledged] = useState(false);
  const { data: alertsData, isLoading } = useAlerts({
    acknowledged: showUnacknowledged ? 'false' : undefined,
  });
  const acknowledgeAll = useAcknowledgeAllAlerts();

  if (isLoading) {
    return <div className="p-8 text-center">Loading alerts...</div>;
  }

  const alerts = alertsData?.data || [];

  if (alerts.length === 0) {
    return (
      <div className="p-8">
        <EmptyState
          title="No alerts"
          description={showUnacknowledged ? 'All alerts acknowledged!' : 'No alerts found'}
        />
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Alerts</h2>
        </div>
        <div className="flex gap-4">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={showUnacknowledged}
              onChange={(e) => setShowUnacknowledged(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300"
            />
            Unacknowledged only
          </label>
          <button
            onClick={() => acknowledgeAll.mutate()}
            disabled={acknowledgeAll.isPending}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
          >
            Acknowledge All
          </button>
        </div>
      </div>

      <AlertList alerts={alerts} />
    </div>
  );
}

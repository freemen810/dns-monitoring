import { useAcknowledgeAlert, useDeleteAlert } from '../../hooks/useAlerts';
import { formatDistanceToNow } from 'date-fns';

export function AlertList({ alerts }) {
  if (!alerts || alerts.length === 0) {
    return <div className="text-center py-8 text-gray-500">No alerts</div>;
  }

  return (
    <div className="space-y-4">
      {alerts.map((alert) => (
        <AlertRow key={alert.id} alert={alert} />
      ))}
    </div>
  );
}

function AlertRow({ alert }) {
  const acknowledgeAlert = useAcknowledgeAlert(alert.id);
  const deleteAlert = useDeleteAlert(alert.id);
  const firedAgo = formatDistanceToNow(new Date(alert.fired_at), { addSuffix: true });

  const alertTypeColor = {
    change: 'bg-blue-100 text-blue-800',
    fail: 'bg-red-100 text-red-800',
    recovery: 'bg-green-100 text-green-800',
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex justify-between items-start mb-2">
        <div>
          <div className="flex items-center gap-2">
            <span className={`px-2 py-1 rounded text-sm font-medium ${alertTypeColor[alert.alert_type]}`}>
              {alert.alert_type.toUpperCase()}
            </span>
            <span className="font-medium text-gray-900">{alert.monitor_name}</span>
            <span className="text-sm text-gray-500">{alert.domain}</span>
          </div>
          <div className="text-sm text-gray-500 mt-1">{firedAgo}</div>
        </div>
        <div className="flex gap-2">
          {!alert.acknowledged && (
            <button
              onClick={() => acknowledgeAlert.mutate()}
              disabled={acknowledgeAlert.isPending}
              className="px-3 py-1 text-xs bg-green-100 text-green-800 rounded hover:bg-green-200"
            >
              ✓ Acknowledge
            </button>
          )}
          <button
            onClick={() => deleteAlert.mutate()}
            disabled={deleteAlert.isPending}
            className="px-3 py-1 text-xs bg-red-100 text-red-800 rounded hover:bg-red-200"
          >
            Delete
          </button>
        </div>
      </div>
      {alert.old_value || alert.new_value ? (
        <div className="text-sm text-gray-600 mt-2">
          {alert.old_value && (
            <div>
              <span className="font-medium">Previous:</span>{' '}
              <code className="bg-gray-100 px-2 py-1 rounded text-xs">{alert.old_value}</code>
            </div>
          )}
          {alert.new_value && (
            <div>
              <span className="font-medium">Current:</span>{' '}
              <code className="bg-gray-100 px-2 py-1 rounded text-xs">{alert.new_value}</code>
            </div>
          )}
        </div>
      ) : null}
      {alert.webhook_status && (
        <div className="text-xs text-gray-500 mt-2">Webhook: HTTP {alert.webhook_status}</div>
      )}
    </div>
  );
}

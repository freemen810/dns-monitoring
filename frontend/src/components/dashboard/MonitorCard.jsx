import { Link } from 'react-router-dom';
import { StatusPill } from '../common/StatusPill';
import { formatDistanceToNow } from 'date-fns';

export function MonitorCard({ monitor }) {
  const lastQueried = monitor.last_queried ? new Date(monitor.last_queried) : null;
  const timeAgo = lastQueried ? formatDistanceToNow(lastQueried, { addSuffix: true }) : 'Never';

  return (
    <Link to={`/monitors/${monitor.id}`}>
      <div className="group bg-white rounded-lg border border-gray-100 p-6 hover:border-gray-200 hover:shadow-md transition-all duration-200 cursor-pointer">
        <div className="flex justify-between items-start mb-5">
          <div className="flex-1">
            <h3 className="text-base font-semibold text-gray-900 group-hover:text-accent-600 transition-colors duration-200">
              {monitor.name}
            </h3>
            <p className="text-sm text-gray-500 mt-1">{monitor.domain}</p>
          </div>
          <div className="ml-3">
            <StatusPill status={monitor.last_status || 'fail'} />
          </div>
        </div>

        <div className="space-y-3 text-sm">
          <div className="flex justify-between py-2 border-t border-gray-50">
            <span className="text-gray-500">Record Type</span>
            <span className="font-medium text-gray-900">{monitor.record_type}</span>
          </div>
          <div className="flex justify-between py-2 border-t border-gray-50">
            <span className="text-gray-500">DNS Server</span>
            <span className="font-medium text-gray-900 text-right">{monitor.dns_server}</span>
          </div>
          {monitor.last_response_ms !== null && (
            <div className="flex justify-between py-2 border-t border-gray-50">
              <span className="text-gray-500">Response Time</span>
              <span className="font-medium text-gray-900">{monitor.last_response_ms}ms</span>
            </div>
          )}
          <div className="flex justify-between py-2 border-t border-gray-50">
            <span className="text-gray-500">Last Checked</span>
            <span className="font-medium text-gray-900">{timeAgo}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

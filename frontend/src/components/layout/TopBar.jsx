import { useUnreadAlertCount } from '../../hooks/useAlerts';
import { Link } from 'react-router-dom';

export function TopBar() {
  const { data: unreadCount = 0 } = useUnreadAlertCount();

  return (
    <div className="bg-white border-b border-gray-100 shadow-xs sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-4">
        <div className="flex justify-between items-center h-12">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-accent-500 to-accent-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">🔍</span>
            </div>
            <h1 className="text-xl font-semibold text-gray-900 tracking-tight">DNS Monitor</h1>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/alerts" className="relative">
              <button className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors duration-150">
                🔔 Alerts
              </button>
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-error text-white text-xs font-medium rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

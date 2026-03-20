import { Link, useLocation } from 'react-router-dom';
import clsx from 'clsx';

export function Sidebar() {
  const location = useLocation();

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

  const navItems = [
    { path: '/', label: '📊 Dashboard', icon: '📊' },
    { path: '/monitors', label: '📡 Monitors', icon: '📡' },
  ];

  return (
    <div className="w-56 bg-white border-r border-gray-100 min-h-screen flex flex-col">
      <nav className="flex-1 px-3 py-6 space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={clsx(
              'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-150',
              isActive(item.path)
                ? 'bg-gradient-to-r from-accent-50 to-accent-50 text-accent-700 shadow-xs border border-accent-100'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            )}
          >
            <span className="text-base">{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="px-3 py-4 border-t border-gray-100">
        <p className="text-xs text-gray-400 font-medium px-4">v1.0.0</p>
      </div>
    </div>
  );
}

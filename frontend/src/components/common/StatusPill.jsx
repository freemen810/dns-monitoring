import clsx from 'clsx';

export function StatusPill({ status }) {
  const statusConfig = {
    ok: {
      bg: 'bg-green-50',
      text: 'text-green-700',
      border: 'border-green-200',
      icon: '✓',
      label: 'Healthy'
    },
    fail: {
      bg: 'bg-red-50',
      text: 'text-red-700',
      border: 'border-red-200',
      icon: '✕',
      label: 'Failed'
    },
    timeout: {
      bg: 'bg-yellow-50',
      text: 'text-yellow-700',
      border: 'border-yellow-200',
      icon: '⏱',
      label: 'Timeout'
    },
  };

  const config = statusConfig[status] || statusConfig.fail;

  return (
    <span className={clsx('px-3 py-1.5 rounded-full text-xs font-medium border', config.bg, config.text, config.border)}>
      <span className="mr-1">{config.icon}</span>
      {config.label}
    </span>
  );
}

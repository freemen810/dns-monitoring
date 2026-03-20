import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMonitors, useDeleteMonitor, usePauseMonitor } from '../hooks/useMonitors';
import { EmptyState } from '../components/common/EmptyState';
import { StatusPill } from '../components/common/StatusPill';
import { BulkImportModal } from '../components/monitors/BulkImportModal';
import { formatDistanceToNow } from 'date-fns';
import client from '../api/client';

export function MonitorsManage() {
  const navigate = useNavigate();
  const { data: monitors, isLoading, refetch } = useMonitors();
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [showDeleteAllConfirm, setShowDeleteAllConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteAll = async () => {
    setIsDeleting(true);
    try {
      // Delete all monitors sequentially
      for (const monitor of monitors) {
        await client.delete(`/monitors/${monitor.id}`);
      }
      setShowDeleteAllConfirm(false);
      await refetch();
    } catch (error) {
      console.error('Error deleting monitors:', error);
      alert('Failed to delete some monitors. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center text-gray-500">Loading monitors...</div>;
  }

  if (!monitors || monitors.length === 0) {
    return (
      <>
        <div className="px-8 py-6">
          <div className="max-w-7xl mx-auto">
            <EmptyState
              title="No monitors yet"
              description="Create your first DNS monitor or bulk import from Excel to get started"
              action={
                <div className="flex gap-3">
                  <button
                    onClick={() => navigate('/monitors/new')}
                    className="px-6 py-3 bg-accent-600 text-white rounded-lg hover:bg-accent-700 font-medium transition-colors duration-150"
                  >
                    Create Monitor
                  </button>
                  <button
                    onClick={() => setShowBulkImport(true)}
                    className="px-6 py-3 border border-accent-300 text-accent-600 rounded-lg hover:bg-accent-50 font-medium transition-colors duration-150"
                  >
                    📥 Bulk Import
                  </button>
                </div>
              }
            />
          </div>
        </div>
        <BulkImportModal
          isOpen={showBulkImport}
          onClose={() => setShowBulkImport(false)}
          onSuccess={() => refetch()}
        />
      </>
    );
  }

  return (
    <>
      <div className="px-8 py-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8 flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Monitors</h2>
              <p className="text-gray-500 text-sm mt-1">{monitors.length} monitors in total</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteAllConfirm(true)}
                className="px-4 py-2 border border-error/20 bg-error/10 text-error rounded-lg hover:bg-error/20 font-medium transition-colors duration-150 text-sm"
              >
                🗑️ Delete All
              </button>
              <button
                onClick={() => setShowBulkImport(true)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors duration-150 text-sm"
              >
                📥 Bulk Import
              </button>
              <button
                onClick={() => navigate('/monitors/new')}
                className="px-4 py-2 bg-accent-600 text-white rounded-lg hover:bg-accent-700 font-medium transition-colors duration-150 text-sm"
              >
                + Create Monitor
              </button>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-100 overflow-hidden shadow-xs">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                    Name
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                    Domain
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                    Type
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                    DNS Server
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                    Last Checked
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {monitors.map((monitor) => (
                  <MonitorRow
                    key={monitor.id}
                    monitor={monitor}
                    onNavigate={navigate}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <BulkImportModal
        isOpen={showBulkImport}
        onClose={() => setShowBulkImport(false)}
        onSuccess={() => refetch()}
      />

      {/* Delete All Confirmation Modal */}
      {showDeleteAllConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-2xl font-bold text-gray-900">Delete All Monitors?</h2>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-gray-600">
                This will permanently delete <span className="font-semibold text-gray-900">{monitors.length} monitors</span> and all their historical data.
              </p>
              <p className="text-sm text-gray-500">
                ⚠️ This action cannot be undone. Please proceed with caution.
              </p>
            </div>

            <div className="border-t border-gray-100 p-6 bg-gray-50 flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteAllConfirm(false)}
                disabled={isDeleting}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors duration-150"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAll}
                disabled={isDeleting}
                className="px-4 py-2 bg-error text-white rounded-lg hover:bg-red-600 disabled:opacity-50 font-medium transition-colors duration-150"
              >
                {isDeleting ? 'Deleting...' : 'Delete All'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function MonitorRow({ monitor, onNavigate }) {
  const deleteMonitor = useDeleteMonitor(monitor.id);
  const pauseMonitor = usePauseMonitor(monitor.id);
  const lastQueried = monitor.last_queried ? new Date(monitor.last_queried) : null;
  const timeAgo = lastQueried ? formatDistanceToNow(lastQueried, { addSuffix: true }) : 'Never';

  const handleDelete = () => {
    if (confirm(`Are you sure you want to delete "${monitor.name}"?`)) {
      deleteMonitor.mutate();
    }
  };

  const handleTogglePause = () => {
    pauseMonitor.mutate();
  };

  return (
    <tr className="hover:bg-gray-50 transition-colors duration-150">
      <td className="px-6 py-4 text-sm font-medium text-gray-900">{monitor.name}</td>
      <td className="px-6 py-4 text-sm text-gray-600">{monitor.domain}</td>
      <td className="px-6 py-4 text-sm text-gray-600">{monitor.record_type}</td>
      <td className="px-6 py-4 text-sm text-gray-600">{monitor.dns_server}</td>
      <td className="px-6 py-4">
        <StatusPill status={monitor.last_status || 'fail'} />
      </td>
      <td className="px-6 py-4 text-sm text-gray-600">{timeAgo}</td>
      <td className="px-6 py-4 text-sm">
        <div className="flex gap-2">
          <button
            onClick={() => onNavigate(`/monitors/${monitor.id}/edit`)}
            className="px-3 py-1.5 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors duration-150 text-xs font-medium"
          >
            Edit
          </button>
          <button
            onClick={handleTogglePause}
            disabled={pauseMonitor.isPending}
            className="px-3 py-1.5 border border-yellow-200 bg-yellow-50 text-yellow-700 rounded-md hover:bg-yellow-100 transition-colors duration-150 text-xs font-medium"
          >
            {monitor.is_active ? 'Pause' : 'Resume'}
          </button>
          <button
            onClick={handleDelete}
            disabled={deleteMonitor.isPending}
            className="px-3 py-1.5 border border-red-200 bg-red-50 text-red-700 rounded-md hover:bg-red-100 transition-colors duration-150 text-xs font-medium"
          >
            Delete
          </button>
        </div>
      </td>
    </tr>
  );
}

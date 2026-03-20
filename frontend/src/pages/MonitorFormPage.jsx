import { useParams } from 'react-router-dom';
import { useMonitor } from '../hooks/useMonitors';
import { MonitorForm } from '../components/monitors/MonitorForm';

export function MonitorFormPage() {
  const { id } = useParams();
  const isEdit = !!id;
  const { data: monitor, isLoading } = useMonitor(id);

  if (isEdit && isLoading) {
    return <div className="p-8 text-center">Loading monitor...</div>;
  }

  return (
    <div className="p-8">
      <MonitorForm monitor={monitor} isEdit={isEdit} />
    </div>
  );
}

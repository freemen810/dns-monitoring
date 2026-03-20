import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCreateMonitor, useUpdateMonitor } from '../../hooks/useMonitors';

export function MonitorForm({ monitor, isEdit }) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    domain: '',
    record_type: 'A',
    dns_servers: [{ server: '1.1.1.1', port: 53 }],
    interval_sec: 300,
    webhook_url: '',
    email_recipients: '',
    alert_subject: '',
    alert_message: '',
    alert_on_change: true,
    alert_on_fail: true,
    retention_days: 30,
  });
  const [error, setError] = useState(null);

  const createMonitor = useCreateMonitor();
  const updateMonitor = useUpdateMonitor(monitor?.id);

  useEffect(() => {
    if (monitor) {
      let dnsServers = [{ server: '1.1.1.1', port: 53 }];
      if (monitor.dns_servers) {
        try {
          dnsServers = JSON.parse(monitor.dns_servers);
        } catch {
          dnsServers = [{ server: monitor.dns_server || '1.1.1.1', port: monitor.dns_port || 53 }];
        }
      }

      setFormData({
        name: monitor.name || '',
        domain: monitor.domain || '',
        record_type: monitor.record_type || 'A',
        dns_servers: dnsServers,
        interval_sec: monitor.interval_sec || 300,
        webhook_url: monitor.webhook_url || '',
        email_recipients: monitor.email_recipients || '',
        alert_subject: monitor.alert_subject || '',
        alert_message: monitor.alert_message || '',
        alert_on_change: monitor.alert_on_change === 1,
        alert_on_fail: monitor.alert_on_fail === 1,
        retention_days: monitor.retention_days || 30,
      });
    }
  }, [monitor]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : type === 'number' ? parseInt(value) : value,
    }));
  };

  const handleDnsServerChange = (index, field, value) => {
    setFormData((prev) => {
      const newServers = [...prev.dns_servers];
      newServers[index] = { ...newServers[index], [field]: field === 'port' ? parseInt(value) : value };
      return { ...prev, dns_servers: newServers };
    });
  };

  const addDnsServer = () => {
    setFormData((prev) => ({
      ...prev,
      dns_servers: [...prev.dns_servers, { server: '', port: 53 }],
    }));
  };

  const removeDnsServer = (index) => {
    setFormData((prev) => ({
      ...prev,
      dns_servers: prev.dns_servers.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      if (isEdit) {
        await updateMonitor.mutateAsync(formData);
      } else {
        await createMonitor.mutateAsync(formData);
      }
      navigate('/monitors');
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    }
  };

  const recordTypes = ['A', 'AAAA', 'CNAME', 'MX', 'NS', 'TXT', 'SOA', 'SRV', 'PTR'];
  const intervals = [
    { value: 60, label: '1 minute' },
    { value: 300, label: '5 minutes' },
    { value: 600, label: '10 minutes' },
    { value: 900, label: '15 minutes' },
    { value: 1800, label: '30 minutes' },
    { value: 3600, label: '1 hour' },
  ];
  const retentions = [
    { value: 7, label: '7 days' },
    { value: 14, label: '14 days' },
    { value: 30, label: '30 days' },
    { value: 90, label: '90 days' },
  ];

  return (
    <div className="px-8 py-6">
      <div className="max-w-2xl">
        <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-gray-100 p-8 shadow-xs">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            {isEdit ? 'Edit Monitor' : 'Create Monitor'}
          </h2>
          <p className="text-gray-500 mb-8">
            {isEdit ? 'Update the monitor configuration' : 'Set up a new DNS monitor with email alerts'}
          </p>

          {error && (
            <div className="mb-6 p-4 bg-error/10 border border-error/30 text-error rounded-lg text-sm">
              ❌ {error}
            </div>
          )}

          <div className="space-y-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-900 mb-2">
            Name *
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            placeholder="e.g., Prod A Record"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent"
          />
        </div>

        <div>
          <label htmlFor="domain" className="block text-sm font-medium text-gray-900 mb-2">
            Domain *
          </label>
          <input
            type="text"
            id="domain"
            name="domain"
            value={formData.domain}
            onChange={handleChange}
            required
            placeholder="e.g., example.com"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent"
          />
        </div>

        <div>
          <label htmlFor="record_type" className="block text-sm font-medium text-gray-900 mb-2">
            Record Type *
          </label>
          <select
            id="record_type"
            name="record_type"
            value={formData.record_type}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent"
          >
            {recordTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">DNS Servers *</label>
          <div className="space-y-3">
            {formData.dns_servers.map((server, index) => (
              <div key={index} className="flex gap-2">
                <input
                  type="text"
                  value={server.server}
                  onChange={(e) => handleDnsServerChange(index, 'server', e.target.value)}
                  placeholder="1.1.1.1 or 8.8.8.8"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent"
                  required
                />
                <input
                  type="number"
                  value={server.port}
                  onChange={(e) => handleDnsServerChange(index, 'port', e.target.value)}
                  min="1"
                  max="65535"
                  className="w-24 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent"
                />
                {formData.dns_servers.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeDnsServer(index)}
                    className="px-4 py-2 border border-error/20 bg-error/10 text-error rounded-lg hover:bg-error/20 text-sm font-medium transition-colors duration-150"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={addDnsServer}
            className="mt-3 px-4 py-2 text-sm border border-accent-200 bg-accent-50 text-accent-600 rounded-lg hover:bg-accent-100 font-medium transition-colors duration-150"
          >
            + Add DNS Server
          </button>
        </div>

        <div>
          <label htmlFor="interval_sec" className="block text-sm font-medium text-gray-900 mb-2">
            Poll Interval
          </label>
          <select
            id="interval_sec"
            name="interval_sec"
            value={formData.interval_sec}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent"
          >
            {intervals.map((interval) => (
              <option key={interval.value} value={interval.value}>
                {interval.label}
              </option>
            ))}
          </select>
        </div>

        {/* Webhook & Email Notification Section */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Notifications</h3>

          <div>
            <label htmlFor="webhook_url" className="block text-sm font-medium text-gray-700 mb-2">
              Webhook URL (Optional)
            </label>
            <input
              type="url"
              id="webhook_url"
              name="webhook_url"
              value={formData.webhook_url}
              onChange={handleChange}
              placeholder="https://example.com/webhook"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">
              POST request will be sent to this URL with alert details
            </p>
          </div>

          {/* Email Notifications */}
          <div className="mt-6 bg-gray-50 rounded-lg p-4 border border-gray-200">
            <p className="text-sm font-medium text-gray-900 mb-4">Email Notifications</p>

            <div className="space-y-4">
              <div>
                <label htmlFor="email_recipients" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Recipients (comma-separated)
                </label>
                <input
                  type="text"
                  id="email_recipients"
                  name="email_recipients"
                  value={formData.email_recipients}
                  onChange={handleChange}
                  placeholder="user@example.com, admin@example.com"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Separate multiple emails with commas
                </p>
              </div>

              <div>
                <label htmlFor="alert_subject" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Subject
                </label>
                <input
                  type="text"
                  id="alert_subject"
                  name="alert_subject"
                  value={formData.alert_subject}
                  onChange={handleChange}
                  placeholder="e.g., DNS Alert for {domain}"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Use {'{domain}'} for domain name, {'{status}'} for status
                </p>
              </div>

              <div>
                <label htmlFor="alert_message" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Message (Optional)
                </label>
                <textarea
                  id="alert_message"
                  name="alert_message"
                  value={formData.alert_message}
                  onChange={handleChange}
                  placeholder="Add custom message to email alerts..."
                  rows="4"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Use {'{domain}'}, {'{status}'}, {'{timestamp}'} as variables
                </p>
              </div>
            </div>
          </div>
        </div>

        <div>
          <label htmlFor="retention_days" className="block text-sm font-medium text-gray-900 mb-2">
            Data Retention
          </label>
          <select
            id="retention_days"
            name="retention_days"
            value={formData.retention_days}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent"
          >
            {retentions.map((retention) => (
              <option key={retention.value} value={retention.value}>
                {retention.label}
              </option>
            ))}
          </select>
        </div>

        {/* Alert Options */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Alert Options</h3>
          <div className="space-y-4">
            <label className="flex items-start cursor-pointer">
              <input
                type="checkbox"
                name="alert_on_change"
                checked={formData.alert_on_change}
                onChange={handleChange}
                className="w-5 h-5 rounded border-gray-300 text-accent-600 mt-0.5"
              />
              <span className="ml-3">
                <span className="text-sm font-medium text-gray-900">Alert on DNS record change</span>
                <p className="text-xs text-gray-500 mt-0.5">
                  Get notified when DNS records are modified
                </p>
              </span>
            </label>

            <label className="flex items-start cursor-pointer">
              <input
                type="checkbox"
                name="alert_on_fail"
                checked={formData.alert_on_fail}
                onChange={handleChange}
                className="w-5 h-5 rounded border-gray-300 text-accent-600 mt-0.5"
              />
              <span className="ml-3">
                <span className="text-sm font-medium text-gray-900">Alert on query failure</span>
                <p className="text-xs text-gray-500 mt-0.5">
                  Get notified when DNS queries fail or timeout
                </p>
              </span>
            </label>
          </div>
        </div>
          </div>

          {/* Form Actions */}
          <div className="flex gap-3 pt-6 border-t">
            <button
              type="submit"
              disabled={createMonitor.isPending || updateMonitor.isPending}
              className="px-6 py-2.5 bg-accent-600 text-white rounded-lg hover:bg-accent-700 disabled:opacity-50 font-medium transition-colors duration-150"
            >
              {isEdit ? '✓ Update Monitor' : '+ Create Monitor'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/monitors')}
              className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors duration-150"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

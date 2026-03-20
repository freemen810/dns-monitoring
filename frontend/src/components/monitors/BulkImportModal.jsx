import { useState } from 'react';
import * as XLSX from 'xlsx';
import { useCreateMonitor } from '../../hooks/useMonitors';

export function BulkImportModal({ isOpen, onClose, onSuccess }) {
  const [file, setFile] = useState(null);
  const [parsedData, setParsedData] = useState(null);
  const [error, setError] = useState(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const createMonitor = useCreateMonitor();

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setError(null);
    setParsedData(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(worksheet);

        if (rows.length === 0) {
          setError('Excel file is empty');
          return;
        }

        // Parse the data: each row should have "domain name" and "DNS IP"
        const monitors = rows
          .map((row, index) => {
            const domain = row['domain name']?.trim();
            const dnsIpsString = row['DNS IP']?.trim();

            if (!domain || !dnsIpsString) {
              return null;
            }

            // Split multiple DNS IPs by comma
            const dnsIps = dnsIpsString
              .split(',')
              .map((ip) => ip.trim())
              .filter((ip) => ip.length > 0);

            if (dnsIps.length === 0) {
              return null;
            }

            return {
              domain,
              dnsIps,
              index,
            };
          })
          .filter(Boolean);

        if (monitors.length === 0) {
          setError(
            'No valid domains found. Please ensure your Excel file has "domain name" and "DNS IP" columns.'
          );
          return;
        }

        setParsedData(monitors);
      } catch (err) {
        setError(`Failed to parse Excel file: ${err.message}`);
      }
    };

    reader.onerror = () => {
      setError('Failed to read file');
    };

    reader.readAsArrayBuffer(selectedFile);
  };

  const handleImport = async () => {
    if (!parsedData || parsedData.length === 0) return;

    setIsImporting(true);
    setImportProgress(0);

    try {
      const failedMonitors = [];

      for (let i = 0; i < parsedData.length; i++) {
        const { domain, dnsIps } = parsedData[i];

        try {
          // Create monitor with multiple DNS servers
          const dnsServers = dnsIps.map((ip) => ({
            server: ip,
            port: 53,
          }));

          const monitorData = {
            name: domain,
            domain: domain,
            record_type: 'A',
            dns_servers: dnsServers,
            interval_sec: 300,
            webhook_url: '',
            alert_on_change: true,
            alert_on_fail: true,
            retention_days: 30,
          };

          await createMonitor.mutateAsync(monitorData);
          setImportProgress(((i + 1) / parsedData.length) * 100);
        } catch (err) {
          failedMonitors.push({
            domain,
            error: err.response?.data?.error || err.message,
          });
        }
      }

      if (failedMonitors.length > 0) {
        const failedDomains = failedMonitors.map((m) => m.domain).join(', ');
        setError(
          `Imported ${parsedData.length - failedMonitors.length}/${parsedData.length} monitors. Failed: ${failedDomains}`
        );
      } else {
        onSuccess?.();
        onClose();
      }
    } finally {
      setIsImporting(false);
      setImportProgress(0);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-96 overflow-y-auto">
        <div className="p-6 border-b border-gray-100 sticky top-0 bg-white">
          <h2 className="text-2xl font-bold text-gray-900">Bulk Import Monitors</h2>
          <p className="text-gray-500 text-sm mt-1">
            Upload an Excel file with domains and DNS IPs
          </p>
        </div>

        <div className="p-6 space-y-6">
          {!parsedData ? (
            <div className="space-y-4">
              {/* File Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Excel File
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-accent-500 transition-colors duration-200 cursor-pointer">
                  <input
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleFileChange}
                    className="sr-only"
                    id="file-upload"
                  />
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <div className="text-4xl mb-2">📁</div>
                    <p className="text-gray-900 font-medium">
                      {file ? file.name : 'Click to upload or drag and drop'}
                    </p>
                    <p className="text-gray-500 text-sm mt-1">
                      Excel files (.xlsx, .xls) or CSV with columns: "domain name" and "DNS IP"
                    </p>
                  </label>
                </div>
              </div>

              {/* Example Format */}
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="flex justify-between items-start mb-2">
                  <p className="text-sm font-medium text-gray-700">Expected Format:</p>
                  <a
                    href="/sample-import.csv"
                    download="sample-import.csv"
                    className="text-xs text-accent-600 hover:text-accent-700 font-medium underline"
                  >
                    📥 Download Sample
                  </a>
                </div>
                <div className="text-xs text-gray-600 space-y-1 font-mono">
                  <p>domain name | DNS IP</p>
                  <p>example.com | 1.1.1.1,8.8.8.8</p>
                  <p>example.org | 1.1.1.1,8.8.8.8,9.9.9.9</p>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
                  {error}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {/* Preview */}
              <div>
                <p className="text-sm font-medium text-gray-700 mb-3">
                  Preview ({parsedData.length} monitors)
                </p>
                <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
                      <tr>
                        <th className="px-4 py-2 text-left font-medium text-gray-700">
                          Domain
                        </th>
                        <th className="px-4 py-2 text-left font-medium text-gray-700">
                          DNS Servers
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {parsedData.map((item, idx) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="px-4 py-2 text-gray-900">{item.domain}</td>
                          <td className="px-4 py-2 text-gray-600">
                            {item.dnsIps.join(', ')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
                  {error}
                </div>
              )}

              {/* Import Progress */}
              {isImporting && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    Importing... {Math.round(importProgress)}%
                  </p>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-accent-500 h-2 rounded-full transition-all duration-200"
                      style={{ width: `${importProgress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-100 p-6 bg-gray-50 flex justify-end gap-3">
          {!parsedData ? (
            <>
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors duration-150"
              >
                Cancel
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => {
                  setParsedData(null);
                  setFile(null);
                  setError(null);
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors duration-150"
              >
                Back
              </button>
              <button
                onClick={handleImport}
                disabled={isImporting}
                className="px-6 py-2 bg-accent-600 text-white rounded-lg hover:bg-accent-700 disabled:opacity-50 font-medium transition-colors duration-150"
              >
                {isImporting ? 'Importing...' : `Import ${parsedData.length} Monitors`}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

# DNS Monitoring Dashboard

A full-stack web application for monitoring DNS records on specified DNS servers, with real-time polling, historical tracking, visualization, and webhook alerts.

## Features

- **Direct DNS Querying**: Query specific DNS servers (e.g., 1.1.1.1, 8.8.8.8) with support for multiple record types (A, AAAA, MX, TXT, CNAME, NS, SRV, PTR, SOA)
- **Scheduled Polling**: Automatically poll DNS servers every 5 minutes (configurable: 1m, 5m, 10m, 15m, 30m, 1h)
- **Real-time Dashboard**: Visual monitoring of all monitors with status indicators and response times
- **Response Time Tracking**: Charts showing DNS query latency over time
- **Alert System**: Automatic webhooks on DNS record changes, query failures, and recovery
- **Data Retention**: Configurable data retention (7d, 14d, 30d, 90d) with automatic cleanup
- **History & Analysis**: View historical DNS results and track changes over time

## Quick Start

### Prerequisites
- Node.js v20+
- npm

### Installation

```bash
# Install all dependencies
npm run install:all
```

This will install dependencies for the root project, backend, and frontend.

### Setup Environment Variables

Create `.env` file in the `backend/` directory:

```bash
cp backend/.env.example backend/.env
```

Default values:
```
PORT=3001
DATABASE_PATH=./data/dns_monitor.db
CORS_ORIGIN=http://localhost:5173
DEFAULT_DNS_SERVER=1.1.1.1
QUERY_TIMEOUT_MS=5000
```

### Development

```bash
# Start both backend and frontend concurrently
npm run dev
```

- **Backend**: http://localhost:3001
- **Frontend**: http://localhost:5173

The frontend proxy is configured to route `/api` requests to the backend automatically.

## Project Structure

```
DNS Monitoring/
├── backend/
│   ├── src/
│   │   ├── index.js              # Express server
│   │   ├── db.js                 # SQLite database
│   │   ├── cron.js               # Polling scheduler
│   │   ├── dns/
│   │   │   ├── resolver.js       # DNS query engine
│   │   │   └── differ.js         # Change detection
│   │   ├── services/
│   │   │   ├── monitorService.js # Poll logic
│   │   │   └── alertService.js   # Alert evaluation
│   │   └── routes/
│   │       ├── monitors.js       # Monitor CRUD
│   │       ├── results.js        # History
│   │       ├── alerts.js         # Alert management
│   │       ├── stats.js          # Stats & charts
│   │       └── settings.js       # Global config
│   ├── data/                     # SQLite database file
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── App.jsx               # Router & layout
    │   ├── pages/
    │   │   ├── Dashboard.jsx     # Overview
    │   │   ├── MonitorsManage.jsx# List & edit
    │   │   ├── MonitorDetail.jsx # Single monitor
    │   │   ├── MonitorFormPage.jsx# Create/edit
    │   │   └── AlertsLog.jsx     # Alert history
    │   ├── components/
    │   │   ├── layout/           # TopBar, Sidebar
    │   │   ├── dashboard/        # Monitor cards
    │   │   ├── charts/           # Response time chart
    │   │   ├── monitors/         # Monitor form
    │   │   ├── alerts/           # Alert list
    │   │   └── common/           # Reusable UI
    │   ├── hooks/                # useMonitors, useResults, useAlerts
    │   ├── api/client.js         # Axios setup
    │   └── styles/index.css      # Tailwind
    └── package.json
```

## API Endpoints

### Monitors
- `GET /api/monitors` - List all monitors
- `POST /api/monitors` - Create monitor
- `GET /api/monitors/:id` - Get monitor details
- `PUT /api/monitors/:id` - Update monitor
- `DELETE /api/monitors/:id` - Delete monitor
- `POST /api/monitors/:id/poll` - Manual poll
- `PATCH /api/monitors/:id/pause` - Toggle pause/resume

### Results
- `GET /api/results` - Paginated query results history
- `DELETE /api/results/purge` - Manual retention cleanup

### Alerts
- `GET /api/alerts` - List alerts
- `GET /api/alerts/unread-count` - Unread badge count
- `PATCH /api/alerts/:id/acknowledge` - Mark read
- `POST /api/alerts/acknowledge-all` - Bulk acknowledge
- `DELETE /api/alerts/:id` - Delete alert

### Stats
- `GET /api/stats/summary` - Dashboard counts
- `GET /api/stats/:id/uptime?days=7` - Uptime percentage
- `GET /api/stats/:id/response-times` - Time series for chart

### Settings
- `GET /api/settings` - Get all global settings
- `PATCH /api/settings` - Update settings

## Database Schema

### monitors
- id, name, domain, record_type, dns_server, dns_port
- interval_sec, is_active, webhook_url
- alert_on_change, alert_on_fail, retention_days
- created_at, updated_at

### results
- id, monitor_id, queried_at, status
- response_ms, records (JSON), changed

### alerts
- id, monitor_id, result_id, alert_type
- old_value (JSON), new_value (JSON)
- webhook_status, acknowledged, fired_at

### settings
- key, value (global configuration key-value store)

## Creating a Monitor

1. Navigate to `/monitors`
2. Click "Create Monitor"
3. Fill in the form:
   - **Name**: Human-readable label
   - **Domain**: Domain to query (e.g., `example.com`)
   - **Record Type**: A, AAAA, MX, TXT, CNAME, NS, SRV, PTR, SOA
   - **DNS Server**: IP address of DNS server to query (default: 1.1.1.1)
   - **DNS Port**: Port (default: 53)
   - **Poll Interval**: Frequency (default: 5 minutes)
   - **Data Retention**: How long to keep history
   - **Alert Options**: Enable/disable alerts for changes and failures
   - **Webhook URL**: Optional per-monitor webhook for alerts
4. Click "Create Monitor"

The monitor will start polling immediately and appear on the dashboard.

## Webhook Alert Format

When a monitor triggers an alert, a POST request is sent to the webhook URL with this JSON payload:

```json
{
  "event": "change|fail|recovery",
  "monitor_id": 1,
  "monitor_name": "Prod A Record",
  "domain": "example.com",
  "record_type": "A",
  "dns_server": "1.1.1.1",
  "old_value": ["1.2.3.4"],
  "new_value": ["5.6.7.8"],
  "fired_at": "2026-03-20T12:34:56Z"
}
```

Events:
- `change`: DNS record changed
- `fail`: Query failed (first failure only, not every poll)
- `recovery`: Query succeeded after failure

## Technology Stack

### Backend
- **Node.js + Express**: HTTP API server
- **SQLite3**: Lightweight relational database
- **dns2**: Direct UDP DNS queries
- **node-cron**: Task scheduling
- **Zod**: Schema validation

### Frontend
- **React 18**: UI framework
- **React Router v6**: Client-side routing
- **TanStack Query**: Server state management & caching
- **Recharts**: Data visualization
- **Tailwind CSS**: Styling
- **Axios**: HTTP client
- **date-fns**: Date formatting

## Development Notes

### Adding a New Monitor Type
1. Update `backend/src/dns/resolver.js` to handle the new record type in `canonicalizeAnswers()`
2. Add the type to the `z.enum()` in `backend/src/routes/monitors.js`
3. Update the select options in `frontend/src/components/monitors/MonitorForm.jsx`

### Changing Poll Intervals
Edit the `INTERVAL_CRON_MAP` in `backend/src/cron.js` to support new intervals.

### Custom Webhooks
Webhook URL can be set per-monitor or globally in Settings. Per-monitor takes precedence.

## Troubleshooting

### Monitors not polling
1. Check that the backend is running (`npm run dev:backend`)
2. Verify monitors are set to "Active" (not paused)
3. Check browser console for API errors

### Database locked
- Close the app and delete `backend/data/dns_monitor.db` to reset
- Note: This will clear all monitors and history

### Network errors
- Ensure backend is running on port 3001
- Check CORS_ORIGIN environment variable matches your frontend URL
- Verify DNS server IP is reachable and port 53 is open

## License

MIT

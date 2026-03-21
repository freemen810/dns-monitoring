# DNS Monitoring Dashboard - Project Guide

## Project Overview

A full-stack DNS monitoring application for tracking DNS record changes and query performance. It provides a real-time dashboard, scheduled polling of DNS servers, historical tracking, and webhook-based alerts.

**Key Features:**
- Direct DNS server querying (A, AAAA, MX, TXT, CNAME, NS, SRV, PTR, SOA records)
- Scheduled polling every 5 minutes (configurable: 1m, 5m, 10m, 15m, 30m, 1h)
- Real-time React dashboard with status indicators
- Response time tracking and visualization
- Automatic webhook alerts on DNS changes, failures, and recovery
- Data retention policies (7d, 14d, 30d, 90d)
- Historical analysis and change tracking

## Architecture

Single-container architecture (recent simplification from multi-container):
- **Frontend**: React 18 + Vite, compiled to static assets served by nginx
- **Backend**: Node.js Express API on port 3000
- **Web Server**: Nginx reverse proxy on port 80
- **Database**: SQLite (persisted to volume)

**Container Flow:** nginx → backend API → SQLite

## Tech Stack

### Backend
- **Runtime**: Node.js 20 (Alpine)
- **Framework**: Express 4.19
- **Database**: SQLite3 5.1 (lightweight, file-based)
- **Validation**: Zod 3.23 (schema validation)
- **DNS**: dns2 2.1 (direct UDP DNS queries)
- **Scheduling**: node-cron 3.0 (polling scheduler)
- **Utilities**: dotenv, cors
- **Dev**: nodemon

### Frontend
- **UI Framework**: React 18
- **Build Tool**: Vite 5
- **Routing**: React Router v6
- **State Management**: TanStack Query 5 (server state + caching)
- **Styling**: Tailwind CSS 3 + PostCSS
- **Charts**: Recharts 2.12 (time-series visualization)
- **HTTP**: Axios 1.7
- **Utilities**: clsx, date-fns, xlsx

### DevOps
- **Docker**: Multi-stage build (frontend built, backend runtime)
- **Compose**: Development and production variants
- **CI/CD**: GitHub Actions → GHCR auto-build
- **Orchestration**: Unraid template support (dns-monitoring-unraid-compose-template.xml)

## How to Run

### Development Setup

```bash
# Install all dependencies (root, backend, frontend)
npm run install:all

# Start backend and frontend concurrently
npm run dev
```

Access:
- **Frontend**: http://localhost:5173 (Vite dev server)
- **Backend**: http://localhost:3001 (Express)

Frontend proxies `/api/*` to backend automatically via Vite config.

### Local Docker (Development)

```bash
# Build and run all services
npm run docker:up

# View logs
npm run docker:logs

# Tear down
npm run docker:down

# Full rebuild
npm run docker:rebuild
```

Services in dev compose:
- `backend`: Port 3001, hot-reload via nodemon
- `frontend`: Port 5173, Vite dev server
- `nginx`: Ports 80/443, reverse proxy

### Production Docker

```bash
# Use docker-compose.prod.yml
docker-compose -f docker-compose.prod.yml up

# Or with Unraid template
# Uses ghcr.io/freemen810/dns-monitoring:latest
```

### Environment Variables

**Backend** (`.env` in `backend/`):
```
PORT=3001                      # API port
DATABASE_PATH=./data/dns_monitor.db
CORS_ORIGIN=http://localhost:5173
DEFAULT_DNS_SERVER=1.1.1.1     # Fallback DNS server
QUERY_TIMEOUT_MS=5000          # DNS query timeout
NODE_ENV=development|production
```

**Frontend** (passed via Docker or Vite):
```
VITE_API_URL=http://localhost:3001  # Backend API base URL
```

## Project Structure

```
.
├── backend/
│   ├── src/
│   │   ├── index.js            # Express app setup, routes mounting
│   │   ├── db.js               # Promise-wrapped SQLite interface
│   │   ├── cron.js             # Poll scheduler, interval config
│   │   ├── dns/
│   │   │   ├── resolver.js     # DNS query logic, response parsing
│   │   │   └── differ.js       # Change detection between polls
│   │   ├── middleware/
│   │   │   └── errorHandler.js # Global error handling
│   │   ├── routes/
│   │   │   ├── monitors.js     # CRUD: create/read/update/delete/poll/pause
│   │   │   ├── results.js      # Historical query results, pagination
│   │   │   ├── alerts.js       # Alert read/acknowledge/delete
│   │   │   ├── stats.js        # Uptime %, response time charts
│   │   │   └── settings.js     # Global config key-value store
│   │   ├── services/
│   │   │   ├── monitorService.js  # Core: poll, evaluate, webhook
│   │   │   └── alertService.js    # Alert generation logic
│   │   └── data/               # SQLite database file (gitignored)
│   ├── package.json            # Backend dependencies only
│   └── .env.example
│
├── frontend/
│   ├── src/
│   │   ├── main.jsx            # React entry point
│   │   ├── App.jsx             # Router setup, layout
│   │   ├── api/
│   │   │   └── client.js       # Axios instance, API utilities
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx       # Overview, monitor cards
│   │   │   ├── MonitorsManage.jsx  # List all monitors
│   │   │   ├── MonitorDetail.jsx   # Single monitor with chart
│   │   │   ├── MonitorFormPage.jsx # Create/edit monitor
│   │   └── AlertsLog.jsx       # Alert history, bulk acknowledge
│   │   ├── components/
│   │   │   ├── layout/         # TopBar, Sidebar, main layout
│   │   │   ├── dashboard/      # Monitor status cards
│   │   │   ├── charts/         # Response time visualizations
│   │   │   ├── monitors/       # Monitor form, validation
│   │   │   ├── alerts/         # Alert list, filters
│   │   │   └── common/         # Buttons, modals, spinners
│   │   ├── hooks/
│   │   │   ├── useMonitors.js     # Query monitors via TanStack Query
│   │   │   ├── useResults.js      # Fetch historical results
│   │   │   └── useAlerts.js       # Fetch and manage alerts
│   │   ├── styles/
│   │   │   └── index.css       # Tailwind directives
│   │   └── vite.config.js      # Vite + React plugin, proxy config
│   └── package.json
│
├── Dockerfile              # Multi-stage: build frontend, run both in one image
├── Dockerfile.backend      # Backend-only image (dev use)
├── Dockerfile.frontend     # Frontend-only image (dev use)
├── docker-compose.yml      # Development: separate services, hot-reload
├── docker-compose.prod.yml # Production: single image, healthchecks
├── docker-compose.unraid.yml # Unraid-specific variant
├── nginx.conf              # Reverse proxy: /api → backend, / → frontend
├── dns-monitoring-unraid-compose-template.xml  # Unraid template
├── package.json            # Root: shared scripts (dev, install:all, docker:*)
└── README.md               # User-facing documentation
```

## Important Conventions & Patterns

### Backend

**Module System**: ES modules (`"type": "module"`)
- Use `import/export`, not `require()`
- Use `import.meta.url` for `__dirname` equivalent

**Database Pattern** ([db.js](backend/src/db.js)):
- Promise-wrapped SQLite interface (avoid callback hell)
- Methods: `.run()`, `.get()`, `.all()` on prepared statements
- Foreign keys enabled at runtime
- Example:
  ```javascript
  const result = await db.prepare('INSERT INTO monitors (...) VALUES (...)').run(values...);
  const row = await db.prepare('SELECT * FROM monitors WHERE id = ?').get(monitorId);
  ```

**Route Structure** (`routes/*.js`):
- Each file exports an `express.Router()`
- Mounted in [index.js](backend/src/index.js) as `/api/{entity}`
- Use Zod for request validation
- Responses are JSON: `res.json({ data })` or `res.status(code).json({ error })`

**Service Layer** (`services/*.js`):
- Business logic separated from routes
- `monitorService.js`: Poll scheduling, webhook delivery
- `alertService.js`: Alert generation and evaluation

**Error Handling** ([middleware/errorHandler.js](backend/src/middleware/errorHandler.js)):
- Global handler catches all route errors
- Returns consistent `{ error: "message" }` format
- Passed to Express with `app.use(errorHandler)` (must be last)

### Frontend

**Component Organization**:
- Pages: Full-screen views (Dashboard, MonitorsManage, MonitorDetail, etc.)
- Components: Reusable UI units organized by feature (dashboard/, charts/, monitors/, etc.)
- Hooks: Custom React hooks for API calls (useMonitors, useResults, useAlerts)

**Data Fetching** ([api/client.js](frontend/src/api/client.js)):
- Axios instance with base URL from `VITE_API_URL` env
- TanStack Query wraps all API calls for caching and refetching
- Hooks use `useQuery()` and `useMutation()`

**Styling**:
- Tailwind CSS for all styling
- No CSS Modules or styled-components
- Component-level class strings built with `clsx()`

**Routing** ([App.jsx](frontend/src/App.jsx)):
- React Router v6 `<BrowserRouter>` wrapping all routes
- Routes mounted on pages/
- Layout shared via wrapper component

## Common Commands

```bash
# Development
npm run dev              # Start both backend + frontend
npm run dev:backend     # Start backend only (port 3001)
npm run dev:frontend    # Start frontend only (port 5173)

# Installation
npm run install:all     # Install deps for root, backend, frontend

# Docker (Development)
npm run docker:build    # Build image: dns-monitoring:latest
npm run docker:up       # docker-compose up --build
npm run docker:down     # docker-compose down
npm run docker:logs     # docker-compose logs -f
npm run docker:rebuild  # Full clean rebuild

# Build
npm run build           # Build frontend only (creates frontend/dist/)
```

## Database Schema

### `monitors`
Core monitoring configuration per DNS record.

```sql
CREATE TABLE monitors (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  domain TEXT NOT NULL,
  record_type TEXT NOT NULL,  -- A, AAAA, MX, TXT, CNAME, NS, SRV, PTR, SOA
  dns_server TEXT NOT NULL,
  dns_port INTEGER DEFAULT 53,
  interval_sec INTEGER DEFAULT 300,  -- Default 5 minutes
  is_active BOOLEAN DEFAULT 1,       -- Paused/resumed
  webhook_url TEXT,
  alert_on_change BOOLEAN DEFAULT 1,
  alert_on_fail BOOLEAN DEFAULT 1,
  retention_days INTEGER DEFAULT 30,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### `results`
Historical DNS query results (one row per poll).

```sql
CREATE TABLE results (
  id INTEGER PRIMARY KEY,
  monitor_id INTEGER NOT NULL,
  queried_at TIMESTAMP NOT NULL,
  status TEXT NOT NULL,        -- 'success' or 'error'
  response_ms INTEGER,         -- Query duration in milliseconds
  records TEXT,                -- JSON array of DNS answers
  changed BOOLEAN,             -- True if differs from previous result
  FOREIGN KEY (monitor_id) REFERENCES monitors(id)
);
```

### `alerts`
Alert events triggered by changes/failures.

```sql
CREATE TABLE alerts (
  id INTEGER PRIMARY KEY,
  monitor_id INTEGER NOT NULL,
  result_id INTEGER,
  alert_type TEXT NOT NULL,    -- 'change', 'fail', 'recovery'
  old_value TEXT,              -- JSON: previous records
  new_value TEXT,              -- JSON: new records
  webhook_status TEXT,         -- 'pending', 'delivered', 'failed'
  acknowledged BOOLEAN DEFAULT 0,
  fired_at TIMESTAMP NOT NULL,
  FOREIGN KEY (monitor_id) REFERENCES monitors(id),
  FOREIGN KEY (result_id) REFERENCES results(id)
);
```

### `settings`
Global configuration key-value store.

```sql
CREATE TABLE settings (
  key TEXT PRIMARY KEY,
  value TEXT
);
```

## API Endpoints Reference

### Monitors (`/api/monitors`)
- `GET /` — List all monitors
- `POST /` — Create monitor (POST body with form data)
- `GET /:id` — Get single monitor
- `PUT /:id` — Update monitor
- `DELETE /:id` — Delete monitor
- `POST /:id/poll` — Trigger immediate poll
- `PATCH /:id/pause` — Toggle pause (flip `is_active`)

### Results (`/api/results`)
- `GET /` — Paginated query history (query params: `limit`, `offset`, `monitorId`)
- `DELETE /purge` — Manual retention cleanup (deletes based on `retention_days`)

### Alerts (`/api/alerts`)
- `GET /` — List all alerts
- `GET /unread-count` — Count unacknowledged alerts
- `PATCH /:id/acknowledge` — Mark alert as read
- `POST /acknowledge-all` — Bulk acknowledge all
- `DELETE /:id` — Delete alert

### Stats (`/api/stats`)
- `GET /summary` — Dashboard counts (total monitors, alerts, uptime)
- `GET /:id/uptime?days=7` — Uptime percentage
- `GET /:id/response-times` — Time-series data for chart

### Settings (`/api/settings`)
- `GET /` — Fetch all global settings
- `PATCH /` — Update settings

### Health
- `GET /api/health` — Simple health check

## Gotchas & Non-Obvious Things

### 1. **Single Container Architecture**
Recent commits simplified to one Docker image (backend + frontend + nginx in one container). Dev compose still has separate services for hot-reload, but production uses single `ghcr.io/freemen810/dns-monitoring:latest` image.

### 2. **Database Location**
SQLite file lives at `backend/data/dns_monitor.db` (gitignored). In Docker, mounted as a volume so data persists across restarts.

### 3. **Promise-Based SQLite Wrapper**
The native sqlite3 module uses callbacks, but [db.js](backend/src/db.js) wraps it in Promises. Use `.run()`, `.get()`, `.all()` on prepared statements—do not use raw SQL strings.

### 4. **Frontend Proxy During Development**
Vite dev server auto-proxies `/api/*` → backend. The proxy URL comes from [vite.config.js](frontend/vite.config.js). In production, nginx handles this.

### 5. **Nginx Resolves Backend at Runtime**
Nginx config uses `resolver 127.0.0.11:53` (Docker's internal DNS) to resolve `localhost:3000` upstream. This allows dynamic container networking.

### 6. **Poll Scheduling is Cron-Based**
[cron.js](backend/src/cron.js) maps user-facing intervals (5m, 10m, etc.) to cron expressions. Each monitor gets its own job; there's no interval-based timer per monitor.

### 7. **Validation with Zod**
All POST/PUT routes validate input with Zod schemas. Invalid payloads return 400 with error details. See [routes/monitors.js](backend/src/routes/monitors.js) for examples.

### 8. **Webhook Delivery is Fire-and-Forget**
Webhook POST requests are sent async (not awaited) when alerts fire. Failures are logged but don't block polling. Webhook status is stored in `alerts.webhook_status` for debugging.

### 9. **Deleted Unraid Template Files**
Git status shows two deleted `.xml` files. These are being replaced by the newer `dns-monitoring-unraid-compose-template.xml`. If you see git errors about them, just commit the deletion.

### 10. **CORS Only in Development**
Production compose sets `CORS_ORIGIN=*` (permissive) because nginx is the only upstream. For local development, it's scoped to `http://localhost:5173`.

### 11. **Tailwind Purging in Production**
Frontend build runs Tailwind purge (via PostCSS). Only classes actually used in JSX are included in the final CSS. Inline class strings won't be purged.

### 12. **No Database Migrations**
The app creates tables on first run (in [db.js](backend/src/db.js) initialization). There's no migration system; schema changes require manual SQL. Always use `PRAGMA foreign_keys = ON` when modifying schema.

## Common Development Tasks

### Adding a New DNS Record Type
1. Update `resolver.js` to handle the record type in `canonicalizeAnswers()`
2. Add type to Zod enum in `routes/monitors.js`
3. Update select options in `components/monitors/MonitorForm.jsx`

### Changing Poll Intervals
Edit `INTERVAL_CRON_MAP` in `cron.js`. Add new cron expression → interval label mappings.

### Custom Webhook Logic
- Per-monitor webhook: Set `webhook_url` in monitor config
- Global webhook: Store in `settings` table and fallback in `alertService.js`
- Webhook is POST'd when an alert fires; see `monitorService.js` for delivery code

### Debugging Database Issues
```bash
# Connect directly to SQLite
sqlite3 backend/data/dns_monitor.db

# Reset database (CAUTION: loses all data)
rm backend/data/dns_monitor.db
```

## Deployment

### Docker Hub / GHCR
- GitHub Actions workflow: `.github/workflows/docker-publish.yml`
- Builds on every commit to main
- Pushes to `ghcr.io/freemen810/dns-monitoring:latest`

### Unraid
- Use template: `dns-monitoring-unraid-compose-template.xml`
- Pulls image from GHCR
- Creates volumes for database persistence

### Custom Reverse Proxy
- Backend API runs on port 3000 (or `PORT` env var)
- Frontend static files served by included nginx on port 80
- Alternatively, reverse-proxy `/api` → backend, `/` → frontend separately

## Resources

- **README.md** — User-facing documentation (features, quick start, webhook format)
- **docker-compose.prod.yml** — Production deployment template
- **nginx.conf** — Reverse proxy and gzip configuration
- **.github/workflows/docker-publish.yml** — CI/CD pipeline

---

**Last Updated**: 2026-03-21

import db from '../db.js';
import { query as queryDns } from '../dns/resolver.js';
import { detectChange, parseRecords } from '../dns/differ.js';
import { evaluate as evaluateAlerts } from './alertService.js';

/**
 * Parse dns_servers column and fallback to legacy dns_server/dns_port
 */
function getServers(monitor) {
  if (monitor.dns_servers) {
    try {
      return JSON.parse(monitor.dns_servers);
    } catch {
      // Fall back if JSON is invalid
    }
  }
  // Legacy fallback
  return [{ server: monitor.dns_server || '1.1.1.1', port: monitor.dns_port || 53 }];
}

/**
 * Poll a single monitor against a single DNS server
 */
async function pollMonitorServer(monitor, dnsServer) {
  const startTime = Date.now();

  // Query the DNS server
  const result = await queryDns(
    monitor.domain,
    monitor.record_type,
    dnsServer.server,
    dnsServer.port,
    5000
  );

  const responseMs = Date.now() - startTime;

  // Get previous result for this specific server for change detection
  const prevResult = await db
    .prepare(
      'SELECT records FROM results WHERE monitor_id = ? AND dns_server = ? ORDER BY queried_at DESC LIMIT 1'
    )
    .get(monitor.id, dnsServer.server);

  const prevRecords = prevResult ? parseRecords(prevResult.records) : null;
  const changed = detectChange(result.records, prevRecords);

  // Insert new result
  const insertResult = await db.prepare(`
    INSERT INTO results (monitor_id, status, response_ms, records, changed, dns_server)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    monitor.id,
    result.status,
    result.status === 'ok' ? responseMs : null,
    JSON.stringify(result.records),
    changed ? 1 : 0,
    dnsServer.server
  );

  // Fetch the inserted result for alert evaluation
  const newResult = await db.prepare('SELECT * FROM results WHERE id = ?').get(insertResult.lastInsertRowid);

  // Evaluate and fire alerts
  await evaluateAlerts(monitor, newResult, prevResult);

  return newResult;
}

/**
 * Poll a single monitor against all configured DNS servers in parallel
 */
export async function pollMonitor(monitorId) {
  const monitor = await db.prepare('SELECT * FROM monitors WHERE id = ?').get(monitorId);
  if (!monitor) {
    throw new Error(`Monitor ${monitorId} not found`);
  }

  const servers = getServers(monitor);
  const results = [];

  // Poll all servers in parallel
  const promises = servers.map((server) => pollMonitorServer(monitor, server));
  const pollResults = await Promise.all(promises);
  results.push(...pollResults);

  return results;
}

/**
 * Manually poll all active monitors
 */
export async function pollAllMonitors() {
  const monitors = await db.prepare('SELECT id FROM monitors WHERE is_active = 1').all();

  const results = [];
  for (const monitor of monitors) {
    try {
      const result = await pollMonitor(monitor.id);
      results.push(...result);
    } catch (error) {
      console.error(`Error polling monitor ${monitor.id}:`, error);
    }
  }

  return results;
}

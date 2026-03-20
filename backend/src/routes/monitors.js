import express from 'express';
import { z } from 'zod';
import db from '../db.js';
import { pollMonitor } from '../services/monitorService.js';
import { scheduleMonitor, unscheduleMonitor, rescheduleMonitor } from '../cron.js';

const router = express.Router();

const monitorSchema = z.object({
  name: z.string().min(1),
  domain: z.string().min(1),
  record_type: z.enum(['A', 'AAAA', 'CNAME', 'MX', 'NS', 'TXT', 'SOA', 'SRV', 'PTR']),
  dns_servers: z.array(z.object({
    server: z.string().min(1),
    port: z.number().int().min(1).max(65535).default(53),
  })).min(1).optional(),
  dns_server: z.string().default('1.1.1.1').optional(),
  dns_port: z.number().int().min(1).max(65535).default(53).optional(),
  interval_sec: z.number().int().min(60).default(300),
  webhook_url: z.string().url().optional().or(z.literal('')),
  email_recipients: z.string().optional().or(z.literal('')),
  alert_subject: z.string().optional().or(z.literal('')),
  alert_message: z.string().optional().or(z.literal('')),
  alert_on_change: z.boolean().default(true),
  alert_on_fail: z.boolean().default(true),
  retention_days: z.number().int().min(1).default(30),
}).transform((data) => {
  // Support both new dns_servers array and legacy dns_server/dns_port
  let servers = data.dns_servers;
  if (!servers || servers.length === 0) {
    servers = [{
      server: data.dns_server || '1.1.1.1',
      port: data.dns_port || 53,
    }];
  }
  return { ...data, dns_servers: servers };
});

// List all monitors
router.get('/', async (req, res) => {
  try {
    const monitors = await db
      .prepare(
        `
      SELECT m.*,
        (SELECT MAX(queried_at) FROM results WHERE monitor_id = m.id) as last_queried,
        (SELECT status FROM results WHERE monitor_id = m.id ORDER BY queried_at DESC LIMIT 1) as last_status,
        (SELECT response_ms FROM results WHERE monitor_id = m.id ORDER BY queried_at DESC LIMIT 1) as last_response_ms
      FROM monitors m
      ORDER BY m.created_at DESC
    `
      )
      .all();

    res.json(monitors);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single monitor with latest result
router.get('/:id', async (req, res) => {
  try {
    const monitor = await db.prepare('SELECT * FROM monitors WHERE id = ?').get(req.params.id);
    if (!monitor) {
      return res.status(404).json({ error: 'Monitor not found' });
    }

    const result = await db
      .prepare('SELECT * FROM results WHERE monitor_id = ? ORDER BY queried_at DESC LIMIT 1')
      .get(req.params.id);

    res.json({ ...monitor, lastResult: result || null });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create monitor
router.post('/', async (req, res) => {
  try {
    const data = monitorSchema.parse(req.body);

    const result = await db.prepare(`
      INSERT INTO monitors (name, domain, record_type, dns_server, dns_port, dns_servers, interval_sec, webhook_url, email_recipients, alert_subject, alert_message, alert_on_change, alert_on_fail, retention_days)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      data.name,
      data.domain,
      data.record_type,
      data.dns_servers[0].server,
      data.dns_servers[0].port,
      JSON.stringify(data.dns_servers),
      data.interval_sec,
      data.webhook_url || null,
      data.email_recipients || null,
      data.alert_subject || null,
      data.alert_message || null,
      data.alert_on_change ? 1 : 0,
      data.alert_on_fail ? 1 : 0,
      data.retention_days
    );

    const monitor = await db.prepare('SELECT * FROM monitors WHERE id = ?').get(result.lastInsertRowid);

    // Schedule the monitor
    scheduleMonitor(monitor);

    res.status(201).json(monitor);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    res.status(500).json({ error: error.message });
  }
});

// Update monitor
router.put('/:id', async (req, res) => {
  try {
    const monitor = await db.prepare('SELECT * FROM monitors WHERE id = ?').get(req.params.id);
    if (!monitor) {
      return res.status(404).json({ error: 'Monitor not found' });
    }

    const data = monitorSchema.parse(req.body);

    await db.prepare(`
      UPDATE monitors
      SET name = ?, domain = ?, record_type = ?, dns_server = ?, dns_port = ?, dns_servers = ?,
          interval_sec = ?, webhook_url = ?, email_recipients = ?, alert_subject = ?, alert_message = ?,
          alert_on_change = ?, alert_on_fail = ?, retention_days = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(
      data.name,
      data.domain,
      data.record_type,
      data.dns_servers[0].server,
      data.dns_servers[0].port,
      JSON.stringify(data.dns_servers),
      data.interval_sec,
      data.webhook_url || null,
      data.email_recipients || null,
      data.alert_subject || null,
      data.alert_message || null,
      data.alert_on_change ? 1 : 0,
      data.alert_on_fail ? 1 : 0,
      data.retention_days,
      req.params.id
    );

    const updated = await db.prepare('SELECT * FROM monitors WHERE id = ?').get(req.params.id);

    // Reschedule if interval or active status changed
    rescheduleMonitor(updated);

    res.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    res.status(500).json({ error: error.message });
  }
});

// Delete monitor
router.delete('/:id', async (req, res) => {
  try {
    const monitor = await db.prepare('SELECT * FROM monitors WHERE id = ?').get(req.params.id);
    if (!monitor) {
      return res.status(404).json({ error: 'Monitor not found' });
    }

    await db.prepare('DELETE FROM monitors WHERE id = ?').run(req.params.id);
    unscheduleMonitor(req.params.id);

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Manual poll
router.post('/:id/poll', async (req, res) => {
  try {
    const monitor = await db.prepare('SELECT * FROM monitors WHERE id = ?').get(req.params.id);
    if (!monitor) {
      return res.status(404).json({ error: 'Monitor not found' });
    }

    const result = await pollMonitor(req.params.id);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Toggle pause/resume
router.patch('/:id/pause', async (req, res) => {
  try {
    const monitor = await db.prepare('SELECT * FROM monitors WHERE id = ?').get(req.params.id);
    if (!monitor) {
      return res.status(404).json({ error: 'Monitor not found' });
    }

    const newActive = monitor.is_active ? 0 : 1;
    await db.prepare('UPDATE monitors SET is_active = ?, updated_at = datetime("now") WHERE id = ?').run(
      newActive,
      req.params.id
    );

    const updated = await db.prepare('SELECT * FROM monitors WHERE id = ?').get(req.params.id);

    if (newActive) {
      scheduleMonitor(updated);
    } else {
      unscheduleMonitor(req.params.id);
    }

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

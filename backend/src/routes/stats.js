import express from 'express';
import db from '../db.js';

const router = express.Router();

// Dashboard summary
router.get('/summary', async (req, res) => {
  try {
    const { count: totalMonitors } = await db
      .prepare('SELECT COUNT(*) as count FROM monitors')
      .get();

    const { count: failingMonitors } = await db
      .prepare(`
        SELECT COUNT(DISTINCT monitor_id) as count
        FROM results
        WHERE status != 'ok'
          AND queried_at = (
            SELECT MAX(queried_at) FROM results r2 WHERE r2.monitor_id = results.monitor_id
          )
      `)
      .get();

    // Alerts fired today
    const today = new Date().toISOString().split('T')[0];
    const { count: alertsToday } = await db
      .prepare(`
        SELECT COUNT(*) as count
        FROM alerts
        WHERE DATE(fired_at) = ?
      `)
      .get(today);

    res.json({
      totalMonitors,
      failingMonitors,
      alertsToday,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Response times for all monitors (dashboard comparison) - MUST come before /:id routes
router.get('/all/response-times', async (req, res) => {
  try {
    const { from, to, limit = 200 } = req.query;

    let query = `
      SELECT
        m.id as monitor_id,
        m.name as monitor_name,
        r.queried_at,
        r.response_ms,
        r.status,
        r.dns_server
      FROM results r
      JOIN monitors m ON r.monitor_id = m.id
      WHERE r.status = 'ok'
    `;
    const params = [];

    if (from) {
      query += ' AND r.queried_at >= ?';
      params.push(from);
    }

    if (to) {
      query += ' AND r.queried_at <= ?';
      params.push(to);
    }

    query += ' ORDER BY r.queried_at ASC LIMIT ?';
    params.push(parseInt(limit, 10));

    const data = await db.prepare(query).all(...params);

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Uptime and response time for a monitor
router.get('/:id/uptime', async (req, res) => {
  try {
    const { days = 7 } = req.query;

    const monitor = await db.prepare('SELECT * FROM monitors WHERE id = ?').get(req.params.id);
    if (!monitor) {
      return res.status(404).json({ error: 'Monitor not found' });
    }

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - parseInt(days, 10));
    const cutoffIso = cutoffDate.toISOString();

    const { ok_count, fail_count, total_count, avg_response_ms } = await db
      .prepare(`
        SELECT
          COUNT(CASE WHEN status = 'ok' THEN 1 END) as ok_count,
          COUNT(CASE WHEN status != 'ok' THEN 1 END) as fail_count,
          COUNT(*) as total_count,
          ROUND(AVG(CASE WHEN status = 'ok' THEN response_ms ELSE NULL END)) as avg_response_ms
        FROM results
        WHERE monitor_id = ? AND queried_at >= ?
      `)
      .get(req.params.id, cutoffIso);

    const uptime = total_count > 0 ? ((ok_count / total_count) * 100).toFixed(2) : 0;

    res.json({
      uptime: parseFloat(uptime),
      ok_count,
      fail_count,
      total_count,
      avg_response_ms: avg_response_ms || 0,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Response time series for charts
router.get('/:id/response-times', async (req, res) => {
  try {
    const { from, to, limit = 1000 } = req.query;

    const monitor = await db.prepare('SELECT * FROM monitors WHERE id = ?').get(req.params.id);
    if (!monitor) {
      return res.status(404).json({ error: 'Monitor not found' });
    }

    let query =
      'SELECT queried_at, response_ms, status, dns_server FROM results WHERE monitor_id = ? AND status = "ok"';
    const params = [req.params.id];

    if (from) {
      query += ' AND queried_at >= ?';
      params.push(from);
    }

    if (to) {
      query += ' AND queried_at <= ?';
      params.push(to);
    }

    query += ' ORDER BY queried_at ASC LIMIT ?';
    params.push(parseInt(limit, 10));

    const data = await db.prepare(query).all(...params);

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

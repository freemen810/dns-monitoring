import express from 'express';
import db from '../db.js';

const router = express.Router();

// List alerts with filters
router.get('/', async (req, res) => {
  try {
    const { monitor_id, acknowledged, limit = 100, offset = 0 } = req.query;

    let query = `
      SELECT a.*, m.name as monitor_name, m.domain, m.record_type
      FROM alerts a
      JOIN monitors m ON a.monitor_id = m.id
      WHERE 1=1
    `;
    const params = [];

    if (monitor_id) {
      query += ' AND a.monitor_id = ?';
      params.push(monitor_id);
    }

    if (acknowledged !== undefined) {
      query += ' AND a.acknowledged = ?';
      params.push(acknowledged === 'true' ? 1 : 0);
    }

    query += ' ORDER BY a.fired_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit, 10), parseInt(offset, 10));

    const alerts = await db.prepare(query).all(...params);

    // Get total count
    let countQuery = `SELECT COUNT(*) as count FROM alerts a WHERE 1=1`;
    const countParams = [];

    if (monitor_id) {
      countQuery += ' AND a.monitor_id = ?';
      countParams.push(monitor_id);
    }

    if (acknowledged !== undefined) {
      countQuery += ' AND a.acknowledged = ?';
      countParams.push(acknowledged === 'true' ? 1 : 0);
    }

    const { count } = await db.prepare(countQuery).get(...countParams);

    res.json({
      data: alerts,
      total: count,
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get unread count
router.get('/unread-count', async (req, res) => {
  try {
    const { count } = await db
      .prepare('SELECT COUNT(*) as count FROM alerts WHERE acknowledged = 0')
      .get();

    res.json({ count });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Acknowledge single alert
router.patch('/:id/acknowledge', async (req, res) => {
  try {
    const alert = await db.prepare('SELECT * FROM alerts WHERE id = ?').get(req.params.id);

    if (!alert) {
      return res.status(404).json({ error: 'Alert not found' });
    }

    await db.prepare('UPDATE alerts SET acknowledged = 1 WHERE id = ?').run(req.params.id);

    const updated = await db.prepare('SELECT * FROM alerts WHERE id = ?').get(req.params.id);

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Acknowledge all alerts
router.post('/acknowledge-all', async (req, res) => {
  try {
    const result = await db.prepare('UPDATE alerts SET acknowledged = 1 WHERE acknowledged = 0').run();

    res.json({ acknowledged: result.changes });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete alert
router.delete('/:id', async (req, res) => {
  try {
    const alert = await db.prepare('SELECT * FROM alerts WHERE id = ?').get(req.params.id);

    if (!alert) {
      return res.status(404).json({ error: 'Alert not found' });
    }

    await db.prepare('DELETE FROM alerts WHERE id = ?').run(req.params.id);

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

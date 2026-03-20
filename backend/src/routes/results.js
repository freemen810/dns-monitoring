import express from 'express';
import db from '../db.js';

const router = express.Router();

// List results with pagination and filters
router.get('/', async (req, res) => {
  try {
    const { monitor_id, from, to, limit = 100, offset = 0 } = req.query;

    let query = 'SELECT * FROM results WHERE 1=1';
    const params = [];

    if (monitor_id) {
      query += ' AND monitor_id = ?';
      params.push(monitor_id);
    }

    if (from) {
      query += ' AND queried_at >= ?';
      params.push(from);
    }

    if (to) {
      query += ' AND queried_at <= ?';
      params.push(to);
    }

    query += ' ORDER BY queried_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit, 10), parseInt(offset, 10));

    const results = await db.prepare(query).all(...params);

    // Get total count for pagination
    let countQuery = 'SELECT COUNT(*) as count FROM results WHERE 1=1';
    const countParams = [];

    if (monitor_id) {
      countQuery += ' AND monitor_id = ?';
      countParams.push(monitor_id);
    }

    if (from) {
      countQuery += ' AND queried_at >= ?';
      countParams.push(from);
    }

    if (to) {
      countQuery += ' AND queried_at <= ?';
      countParams.push(to);
    }

    const { count } = await db.prepare(countQuery).get(...countParams);

    res.json({
      data: results,
      total: count,
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single result
router.get('/:id', async (req, res) => {
  try {
    const result = await db.prepare('SELECT * FROM results WHERE id = ?').get(req.params.id);

    if (!result) {
      return res.status(404).json({ error: 'Result not found' });
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Manual retention cleanup
router.delete('/purge', async (req, res) => {
  try {
    const monitors = await db.prepare('SELECT id, retention_days FROM monitors').all();

    let purgedCount = 0;

    for (const monitor of monitors) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - monitor.retention_days);
      const cutoffIso = cutoffDate.toISOString();

      const resultDel = await db
        .prepare('DELETE FROM results WHERE monitor_id = ? AND queried_at < ?')
        .run(monitor.id, cutoffIso);

      purgedCount += resultDel.changes;

      await db.prepare('DELETE FROM alerts WHERE monitor_id = ? AND fired_at < ?').run(
        monitor.id,
        cutoffIso
      );
    }

    res.json({ purged: purgedCount });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

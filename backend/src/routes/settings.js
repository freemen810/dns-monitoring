import express from 'express';
import db from '../db.js';

const router = express.Router();

// Get all settings
router.get('/', async (req, res) => {
  try {
    const settings = await db.prepare('SELECT key, value FROM settings').all();

    const result = {};
    for (const setting of settings) {
      result[setting.key] = setting.value;
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update settings
router.patch('/', async (req, res) => {
  try {
    const { global_webhook_url, default_retention_days, default_interval_sec } = req.body;

    if (global_webhook_url !== undefined) {
      await db.prepare('INSERT OR REPLACE INTO settings(key, value) VALUES (?, ?)')
        .run('global_webhook_url', global_webhook_url);
    }

    if (default_retention_days !== undefined) {
      await db.prepare('INSERT OR REPLACE INTO settings(key, value) VALUES (?, ?)')
        .run('default_retention_days', String(default_retention_days));
    }

    if (default_interval_sec !== undefined) {
      await db.prepare('INSERT OR REPLACE INTO settings(key, value) VALUES (?, ?)')
        .run('default_interval_sec', String(default_interval_sec));
    }

    const settings = await db.prepare('SELECT key, value FROM settings').all();

    const result = {};
    for (const setting of settings) {
      result[setting.key] = setting.value;
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

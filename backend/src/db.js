import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = process.env.DATABASE_PATH || path.join(__dirname, '../data/dns_monitor.db');

// Promise-based SQLite wrapper
class Database {
  constructor(path) {
    this.db = new sqlite3.Database(path);
    this.db.serialize(() => {
      this.db.run('PRAGMA foreign_keys = ON');
    });
  }

  prepare(sql) {
    const db = this.db;
    return {
      run: (...params) => {
        return new Promise((resolve, reject) => {
          db.run(sql, params, function (err) {
            if (err) {
              reject(err);
            } else {
              resolve({ changes: this.changes, lastInsertRowid: this.lastID });
            }
          });
        });
      },
      get: (...params) => {
        return new Promise((resolve, reject) => {
          db.get(sql, params, (err, row) => {
            if (err) reject(err);
            else resolve(row);
          });
        });
      },
      all: (...params) => {
        return new Promise((resolve, reject) => {
          db.all(sql, params, (err, rows) => {
            if (err) reject(err);
            else resolve(rows || []);
          });
        });
      },
    };
  }

  exec(sql) {
    return new Promise((resolve, reject) => {
      this.db.exec(sql, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  close() {
    return new Promise((resolve, reject) => {
      this.db.close((err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }
}

const db = new Database(dbPath);

// Initialize schema on startup
const schema = `
CREATE TABLE IF NOT EXISTS monitors (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    name            TEXT    NOT NULL,
    domain          TEXT    NOT NULL,
    record_type     TEXT    NOT NULL,
    dns_server      TEXT    NOT NULL DEFAULT '1.1.1.1',
    dns_port        INTEGER NOT NULL DEFAULT 53,
    dns_servers     TEXT,
    interval_sec    INTEGER NOT NULL DEFAULT 300,
    is_active       INTEGER NOT NULL DEFAULT 1,
    webhook_url     TEXT,
    alert_on_change INTEGER NOT NULL DEFAULT 1,
    alert_on_fail   INTEGER NOT NULL DEFAULT 1,
    retention_days  INTEGER NOT NULL DEFAULT 30,
    created_at      TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')),
    updated_at      TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now'))
);

CREATE TABLE IF NOT EXISTS results (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    monitor_id  INTEGER NOT NULL REFERENCES monitors(id) ON DELETE CASCADE,
    queried_at  TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')),
    status      TEXT    NOT NULL,
    response_ms INTEGER,
    records     TEXT,
    dns_server  TEXT,
    changed     INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_results_monitor_queried
    ON results(monitor_id, queried_at DESC);

CREATE TABLE IF NOT EXISTS alerts (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    monitor_id     INTEGER NOT NULL REFERENCES monitors(id) ON DELETE CASCADE,
    result_id      INTEGER REFERENCES results(id) ON DELETE SET NULL,
    alert_type     TEXT    NOT NULL,
    old_value      TEXT,
    new_value      TEXT,
    webhook_status INTEGER,
    acknowledged   INTEGER NOT NULL DEFAULT 0,
    fired_at       TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now'))
);

CREATE INDEX IF NOT EXISTS idx_alerts_monitor_fired
    ON alerts(monitor_id, fired_at DESC);

CREATE INDEX IF NOT EXISTS idx_alerts_acknowledged
    ON alerts(acknowledged, fired_at DESC);

CREATE TABLE IF NOT EXISTS settings (
    key   TEXT PRIMARY KEY,
    value TEXT NOT NULL
);

INSERT OR IGNORE INTO settings(key, value) VALUES
    ('global_webhook_url', ''),
    ('default_retention_days', '30');
`;

async function initializeDatabase() {
  try {
    // Run initial schema
    await db.exec(schema);
    console.log('Database schema initialized');

    // Run migrations to add new columns if they don't exist
    try {
      await db.prepare('SELECT dns_servers FROM monitors LIMIT 1').get();
    } catch {
      console.log('Adding dns_servers column to monitors...');
      await new Promise((resolve, reject) => {
        db.db.run('ALTER TABLE monitors ADD COLUMN dns_servers TEXT', (err) => {
          if (err && !err.message.includes('duplicate column')) {
            reject(err);
          } else {
            resolve();
          }
        });
      });
    }

    try {
      await db.prepare('SELECT dns_server FROM results LIMIT 1').get();
    } catch {
      console.log('Adding dns_server column to results...');
      await new Promise((resolve, reject) => {
        db.db.run('ALTER TABLE results ADD COLUMN dns_server TEXT', (err) => {
          if (err && !err.message.includes('duplicate column')) {
            reject(err);
          } else {
            resolve();
          }
        });
      });
    }

    // Add email notification columns to monitors table
    try {
      await db.prepare('SELECT email_recipients FROM monitors LIMIT 1').get();
    } catch {
      console.log('Adding email notification columns to monitors...');
      await new Promise((resolve, reject) => {
        db.db.run('ALTER TABLE monitors ADD COLUMN email_recipients TEXT', (err) => {
          if (err && !err.message.includes('duplicate column')) {
            reject(err);
          } else {
            resolve();
          }
        });
      });
    }

    try {
      await db.prepare('SELECT alert_subject FROM monitors LIMIT 1').get();
    } catch {
      console.log('Adding alert_subject column to monitors...');
      await new Promise((resolve, reject) => {
        db.db.run('ALTER TABLE monitors ADD COLUMN alert_subject TEXT', (err) => {
          if (err && !err.message.includes('duplicate column')) {
            reject(err);
          } else {
            resolve();
          }
        });
      });
    }

    try {
      await db.prepare('SELECT alert_message FROM monitors LIMIT 1').get();
    } catch {
      console.log('Adding alert_message column to monitors...');
      await new Promise((resolve, reject) => {
        db.db.run('ALTER TABLE monitors ADD COLUMN alert_message TEXT', (err) => {
          if (err && !err.message.includes('duplicate column')) {
            reject(err);
          } else {
            resolve();
          }
        });
      });
    }

    console.log('Database migrations completed');
  } catch (err) {
    console.error('Failed to initialize database:', err);
    process.exit(1);
  }
}

initializeDatabase();

export default db;

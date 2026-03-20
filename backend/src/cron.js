import cron from 'node-cron';
import db from './db.js';
import { pollMonitor } from './services/monitorService.js';

// Map of monitorId -> cron task
const tasks = new Map();

// Interval to cron expression mapping
const INTERVAL_CRON_MAP = {
  60: '* * * * *',           // every minute
  300: '*/5 * * * *',        // every 5 min
  600: '*/10 * * * *',       // every 10 min
  900: '*/15 * * * *',       // every 15 min
  1800: '*/30 * * * *',      // every 30 min
  3600: '0 * * * *',         // every hour
};

/**
 * Find closest supported interval
 */
function getClosestInterval(intervalSec) {
  const intervals = Object.keys(INTERVAL_CRON_MAP).map(Number).sort((a, b) => a - b);
  return intervals.reduce((prev, curr) =>
    Math.abs(curr - intervalSec) < Math.abs(prev - intervalSec) ? curr : prev
  );
}

/**
 * Start polling for a single monitor
 */
export function scheduleMonitor(monitor) {
  if (tasks.has(monitor.id)) {
    tasks.get(monitor.id).stop();
  }

  if (!monitor.is_active) {
    return;
  }

  const closestInterval = getClosestInterval(monitor.interval_sec);
  const cronExpression = INTERVAL_CRON_MAP[closestInterval];

  const task = cron.schedule(cronExpression, async () => {
    try {
      await pollMonitor(monitor.id);
    } catch (error) {
      console.error(`Cron poll error for monitor ${monitor.id}:`, error);
    }
  });

  tasks.set(monitor.id, task);
  console.log(`Monitor ${monitor.id} scheduled with cron: ${cronExpression}`);
}

/**
 * Stop polling for a monitor
 */
export function unscheduleMonitor(monitorId) {
  if (tasks.has(monitorId)) {
    tasks.get(monitorId).stop();
    tasks.delete(monitorId);
    console.log(`Monitor ${monitorId} unscheduled`);
  }
}

/**
 * Reschedule a monitor (stop and start)
 */
export function rescheduleMonitor(monitor) {
  unscheduleMonitor(monitor.id);
  scheduleMonitor(monitor);
}

/**
 * Initialize all active monitors
 */
export async function initializeScheduler() {
  const monitors = await db.prepare('SELECT * FROM monitors WHERE is_active = 1').all();

  for (const monitor of monitors) {
    scheduleMonitor(monitor);
  }

  // Daily cleanup at 3 AM
  const cleanupTask = cron.schedule('0 3 * * *', async () => {
    try {
      const monitors = await db.prepare('SELECT id, retention_days FROM monitors').all();

      for (const monitor of monitors) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - monitor.retention_days);
        const cutoffIso = cutoffDate.toISOString();

        await db.prepare('DELETE FROM results WHERE monitor_id = ? AND queried_at < ?').run(
          monitor.id,
          cutoffIso
        );

        await db.prepare('DELETE FROM alerts WHERE monitor_id = ? AND fired_at < ?').run(
          monitor.id,
          cutoffIso
        );
      }

      console.log('Cleanup job completed');
    } catch (error) {
      console.error('Cleanup job error:', error);
    }
  });

  tasks.set('cleanup', cleanupTask);
  console.log('Scheduler initialized');
}

/**
 * Shutdown all tasks
 */
export function shutdownScheduler() {
  for (const [key, task] of tasks) {
    task.stop();
  }
  tasks.clear();
  console.log('Scheduler shutdown');
}

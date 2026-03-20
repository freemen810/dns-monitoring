import db from '../db.js';
import { parseRecords } from '../dns/differ.js';

/**
 * Fire a webhook with alert payload
 */
async function fireWebhook(webhookUrl, payload) {
  if (!webhookUrl) {
    return null;
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeout);
    return response.status;
  } catch (error) {
    console.error(`Webhook error for ${webhookUrl}:`, error.message);
    return null;
  }
}

/**
 * Create alert record and fire webhook
 */
async function createAlert(monitor, result, alertType, oldValue, newValue) {
  const settings = await db.prepare('SELECT value FROM settings WHERE key = ?').get('global_webhook_url');
  const webhookUrl = monitor.webhook_url || settings?.value;

  const payload = {
    event: alertType,
    monitor_id: monitor.id,
    monitor_name: monitor.name,
    domain: monitor.domain,
    record_type: monitor.record_type,
    dns_server: monitor.dns_server,
    old_value: oldValue,
    new_value: newValue,
    fired_at: new Date().toISOString(),
    // Email notification fields
    email_recipients: monitor.email_recipients ? monitor.email_recipients.split(',').map(e => e.trim()) : [],
    alert_subject: monitor.alert_subject || null,
    alert_message: monitor.alert_message || null,
  };

  const webhookStatus = await fireWebhook(webhookUrl, payload);

  await db.prepare(`
    INSERT INTO alerts (monitor_id, result_id, alert_type, old_value, new_value, webhook_status)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    monitor.id,
    result.id,
    alertType,
    oldValue ? JSON.stringify(oldValue) : null,
    newValue ? JSON.stringify(newValue) : null,
    webhookStatus
  );

  console.log(`Alert ${alertType} fired for monitor ${monitor.id} (${monitor.name})`);
}

/**
 * Evaluate alert conditions based on new result
 */
export async function evaluate(monitor, newResult, previousResult) {
  const newRecords = parseRecords(newResult.records);
  const prevRecords = previousResult ? parseRecords(previousResult.records) : null;

  // CASE 1: Record changed
  if (monitor.alert_on_change && newResult.changed) {
    await createAlert(monitor, newResult, 'change', prevRecords, newRecords);
  }

  // CASE 2: Query failed (first failure only)
  if (monitor.alert_on_fail && newResult.status !== 'ok') {
    const prevStatus = previousResult?.status;
    if (prevStatus === 'ok' || !previousResult) {
      // Only alert on first failure
      await createAlert(monitor, newResult, 'fail', null, null);
    }
  }

  // CASE 3: Recovery (from fail/timeout to ok)
  if (newResult.status === 'ok' && previousResult) {
    const prevStatus = previousResult.status;
    if (prevStatus !== 'ok') {
      await createAlert(monitor, newResult, 'recovery', null, newRecords);
    }
  }
}

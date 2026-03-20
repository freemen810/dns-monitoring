/**
 * Detect if DNS records have changed
 */
export function detectChange(currentRecords, previousRecords) {
  if (!previousRecords) {
    return false;
  }

  const current = JSON.stringify(currentRecords);
  const previous = JSON.stringify(previousRecords);

  return current !== previous;
}

/**
 * Parse JSON string of records, handling both array and string formats
 */
export function parseRecords(recordsJson) {
  if (!recordsJson) {
    return [];
  }

  try {
    return JSON.parse(recordsJson);
  } catch {
    return [];
  }
}
